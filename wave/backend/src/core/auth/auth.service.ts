import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepo } from './auth.repo.js';
import { AuthEntity } from '../../config/database/entities/auth.entity.js';
import { SessionTokens, TokenService } from '../../config/auth/token.service.js';
import { SmsService } from '../../config/sms/sms.service.js';
import { FeaturesConfig } from '../../config/features.config.js';
import { NumberFormatter } from '../../config/utils/numberFormatter.js';
import { Packet } from '../../config/http/packet.js';

export type VerifyOtpResult = SessionTokens & {
  hasProfile: boolean;
  isNewUser: boolean;
  profile: AuthEntity;
  isBlocked: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly tokenService: TokenService,
    private readonly smsService: SmsService,
  ) {}

  // Returns a Packet directly (rather than a plain value for
  // PacketInterceptor to auto-wrap) so this can set its own message -
  // AuthController.generateOtp() just returns whatever this returns
  // unchanged.
  async generateOtp(phone: string, deviceId: string): Promise<Packet<object>> {
    const code = NumberFormatter.randomOtp();
    await this.authRepo.saveOtp(phone, code, deviceId);
    await this.smsService.send(phone, 'otp', { code });
    return Packet.success({}, 'OTP sent successfully');
  }

  async verifyOtp(phone: string, otp: number, deviceId: string): Promise<VerifyOtpResult> {
    const stored = await this.authRepo.findOtp(phone);
    if (!stored) {
      throw new UnauthorizedException('Enter a valid OTP or request a new one');
    }

    const isExpired = Date.now() - stored.updatedAt.getTime() > FeaturesConfig.otp.ttlMs;
    if (isExpired) {
      await this.authRepo.deleteOtp(phone);
      throw new UnauthorizedException('This OTP has expired. Please request a new one');
    }

    if (stored.attempts >= FeaturesConfig.otp.maxAttempts) {
      await this.authRepo.deleteOtp(phone);
      throw new UnauthorizedException('Too many incorrect attempts. Please request a new OTP');
    }

    // Wrong code or a different device than the one that requested it
    // (deviceId is stored precisely to catch the latter) - either way,
    // count it as a failed attempt rather than telling the caller which.
    if (stored.otp !== otp || stored.deviceId !== deviceId) {
      await this.authRepo.incrementOtpAttempts(stored.id);
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.authRepo.deleteOtp(phone);

    const existingProfile = await this.authRepo.findProfileByPhone(phone);
    const profile = existingProfile ?? (await this.authRepo.createProfile(phone));
    const session = this.tokenService.issueSession({ sub: phone });

    return {
      ...session,
      hasProfile: existingProfile !== null,
      isNewUser: existingProfile === null,
      profile,
      isBlocked: false,
    };
  }
}
