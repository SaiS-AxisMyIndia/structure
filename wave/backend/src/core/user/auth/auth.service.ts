import { Injectable } from '@nestjs/common';
import { AuthRepo } from './auth.repo.js';
import { AuthEntity } from '../../../config/entities/auth.entity.js';
import { TokenService, TokenPayload } from '../../../config/auth/token.service.js';
import { SmsService } from '../../../config/sms/sms.service.js';
import { MailService } from '../../../config/mail/mail.service.js';
import { FeaturesConfig } from '../../../config/features.config.js';
import { NumberFormatter } from '../../../config/utils/numberFormatter.js';
import { ContactFormatter } from '../../../config/utils/contactFormatter.js';
import { Flavour } from '../../../config/flavour/flavour.js';
import { Packet } from '../../../config/http/packet.js';

export type GenerateOtpResponse = {
  message: string;
};

export type VerifyOtpResponse = {
  message: string;
  isBlocked: boolean;
  isNewUser: boolean;
  user: AuthEntity;
  token: string;
  refreshToken: string;
};

export type LogoutResponse = {
  message: string;
};

export type RefreshTokenResponse = {
  message: string;
  token: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly tokenService: TokenService,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
  ) {}

  async generateOtp(phone: string, deviceId: string): Promise<Packet<GenerateOtpResponse>> {
    const code = Flavour.isDev() ? FeaturesConfig.otp.devCode : NumberFormatter.randomOtp();
    await this.authRepo.saveOtp(phone, code, deviceId);
    if (ContactFormatter.isEmail(phone)) {
      await this.mailService.send(phone, 'otp', { code });
    } else {
      await this.smsService.send(phone, 'otp', { code });
    }
    return Packet.success({ message: 'OTP sent successfully' });
  }

  async verifyOtp(
    phone: string,
    otp: number,
    deviceId: string,
    deviceName: string | null = null,
  ): Promise<Packet<VerifyOtpResponse>> {
    const stored = await this.authRepo.findOtp(phone, deviceId);
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

    const existingProfile = await this.authRepo.findProfileByPhone(phone);
    const user = existingProfile ?? (await this.authRepo.createProfile(phone));

    if (user.blocked) {
      return Packet.failed('Your account has been blocked. Please contact support.');
    }

    await this.authRepo.upsertDevice(user.id, deviceId, deviceName);

    const session = this.tokenService.issueSession({ id: user.id, role: 'user', did: deviceId });

    return Packet.success({
      message: 'OTP verified successfully',
      isBlocked: user.blocked,
      isNewUser: existingProfile === null,
      user,
      token: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }

  async logout(authId: string, deviceId: string): Promise<Packet<LogoutResponse>> {
    await this.authRepo.deactivateDevice(authId, deviceId);
    return Packet.success({ message: 'Logged out successfully' });
  }

  async logoutAll(authId: string): Promise<Packet<LogoutResponse>> {
    await this.authRepo.deactivateAllDevices(authId);
    return Packet.success({ message: 'Logged out of all devices successfully' });
  }

  async refreshToken(refreshToken: string): Promise<Packet<RefreshTokenResponse>> {
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
    if (!user || user.blocked) {
      return Packet.failed('Your account has been blocked. Please contact support.');
    }

    const session = this.tokenService.issueSession({ id: user.id, role: 'user', did: payload.did });

    return Packet.success({
      message: 'Token refreshed successfully',
      token: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }
}
