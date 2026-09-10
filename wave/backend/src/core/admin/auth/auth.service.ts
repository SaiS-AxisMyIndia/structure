import { Injectable } from '@nestjs/common';
import { AuthRepo } from '../../user/auth/auth.repo.js';
import { AuthEntity, AuthRole } from '../../../config/entities/auth.entity.js';
import { TokenService, TokenPayload } from '../../../config/auth/token.service.js';
import { SmsService } from '../../../config/sms/sms.service.js';
import { MailService } from '../../../config/mail/mail.service.js';
import { FeaturesConfig } from '../../../config/features.config.js';
import { NumberFormatter } from '../../../config/utils/numberFormatter.js';
import { ContactFormatter } from '../../../config/utils/contactFormatter.js';
import { Flavour } from '../../../config/flavour/flavour.js';
import { Packet } from '../../../config/http/packet.js';

const NOT_AUTHORIZED = 'You are not authorized to access the admin panel.';

export type GenerateAdminOtpResponse = {
  message: string;
};

export type VerifyAdminOtpResponse = {
  message: string;
  user: AuthEntity;
  token: string;
  refreshToken: string;
};

export type AdminLogoutResponse = {
  message: string;
};

export type RefreshAdminTokenResponse = {
  message: string;
  token: string;
  refreshToken: string;
};

// Same auth/auth_otp/devices tables as core/user/auth (via the same
// AuthRepo, not a duplicate one) - this is the admin-only surface over
// them: generate/validate-otp both refuse anyone whose account isn't
// already roles === 'admin' (there's no self-service admin signup the way
// a first-time phone/email auto-creates a regular user - see AuthRepo.
// createProfile, never called from here).
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly tokenService: TokenService,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
  ) {}

  async generateOtp(identifier: string, deviceId: string): Promise<Packet<GenerateAdminOtpResponse>> {
    const profile = await this.authRepo.findProfileByPhone(identifier);
    if (!profile || profile.roles !== AuthRole.ADMIN) {
      return Packet.failed(NOT_AUTHORIZED);
    }

    const code = Flavour.isDev() ? FeaturesConfig.otp.devCode : NumberFormatter.randomOtp();
    await this.authRepo.saveOtp(identifier, code, deviceId);
    if (ContactFormatter.isEmail(identifier)) {
      await this.mailService.send(identifier, 'otp', { code });
    } else {
      await this.smsService.send(identifier, 'otp', { code });
    }
    return Packet.success({ message: 'OTP sent successfully' });
  }

  async verifyOtp(
    identifier: string,
    otp: number,
    deviceId: string,
    deviceName: string | null = null,
  ): Promise<Packet<VerifyAdminOtpResponse>> {
    const stored = await this.authRepo.findOtp(identifier, deviceId);
    if (!stored) {
      return Packet.failed('Enter a valid OTP or request a new one');
    }

    const isExpired = Date.now() - stored.updatedAt.getTime() > FeaturesConfig.otp.ttlMs;
    if (isExpired) {
      return Packet.failed('This OTP has expired. Please request a new one');
    }

    if (stored.attempts >= FeaturesConfig.otp.maxAttempts) {
      return Packet.failed('Too many incorrect attempts. Please request a new OTP');
    }

    if (stored.otp !== otp) {
      await this.authRepo.incrementOtpAttempts(stored.id);
      return Packet.failed('Invalid OTP');
    }

    const user = await this.authRepo.findProfileByPhone(identifier);
    if (!user || user.roles !== AuthRole.ADMIN) {
      return Packet.failed(NOT_AUTHORIZED);
    }

    if (user.blocked) {
      return Packet.failed('Your account has been blocked. Please contact support.');
    }

    await this.authRepo.upsertDevice(user.id, deviceId, deviceName);

    const session = this.tokenService.issueSession({ id: user.id, role: 'admin', did: deviceId });

    return Packet.success({
      message: 'OTP verified successfully',
      user,
      token: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }

  async logout(authId: string, deviceId: string): Promise<Packet<AdminLogoutResponse>> {
    await this.authRepo.deactivateDevice(authId, deviceId);
    return Packet.success({ message: 'Logged out successfully' });
  }

  async logoutAll(authId: string): Promise<Packet<AdminLogoutResponse>> {
    await this.authRepo.deactivateAllDevices(authId);
    return Packet.success({ message: 'Logged out of all devices successfully' });
  }

  async refreshToken(refreshToken: string): Promise<Packet<RefreshAdminTokenResponse>> {
    let payload: TokenPayload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      return Packet.failed('Invalid or expired refresh token');
    }

    const isActive = await this.authRepo.isDeviceActive(payload.id, payload.did);
    if (!isActive) {
      return Packet.failed('This session has been logged out. Please log in again.');
    }

    const user = await this.authRepo.findProfileById(payload.id);
    if (!user || user.roles !== AuthRole.ADMIN) {
      return Packet.failed(NOT_AUTHORIZED);
    }

    if (user.blocked) {
      return Packet.failed('Your account has been blocked. Please contact support.');
    }

    const session = this.tokenService.issueSession({ id: user.id, role: 'admin', did: payload.did });

    return Packet.success({
      message: 'Token refreshed successfully',
      token: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }
}
