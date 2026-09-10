import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthOtpEntity } from '../../config/database/entities/auth-otp.entity.js';
import { AuthEntity, AuthRole } from '../../config/database/entities/auth.entity.js';

// Data-access layer - the only layer allowed to know these are TypeORM
// repositories backed by SQLite (see config/database/database.module.ts).
// AuthService/AuthController don't change if this swaps to a different
// DB/ORM later.
@Injectable()
export class AuthRepo {
  constructor(
    @InjectRepository(AuthOtpEntity) private readonly otpRepository: Repository<AuthOtpEntity>,
    @InjectRepository(AuthEntity) private readonly profileRepository: Repository<AuthEntity>,
  ) {}

  // One row per phone - a resend overwrites the previous code/deviceId and
  // resets `attempts` back to 0 (spreading `existing` first means its `id`
  // carries over when present, so `.save()` updates that row instead of
  // inserting a second one for the same phone).
  async saveOtp(phone: string, code: number, deviceId: string): Promise<void> {
    const existing = await this.otpRepository.findOneBy({ phone });
    await this.otpRepository.save({ ...existing, phone, otp: code, deviceId, attempts: 0 });
  }

  findOtp(phone: string): Promise<AuthOtpEntity | null> {
    return this.otpRepository.findOneBy({ phone });
  }

  async incrementOtpAttempts(id: number): Promise<void> {
    await this.otpRepository.increment({ id }, 'attempts', 1);
  }

  // Consumed on a successful verify, and also dropped once expired/attempts
  // are exhausted - either way, the next generate-otp call starts clean.
  async deleteOtp(phone: string): Promise<void> {
    await this.otpRepository.delete({ phone });
  }

  findProfileByPhone(phone: string): Promise<AuthEntity | null> {
    return this.profileRepository.findOneBy({ phone });
  }

  // First-successful-login row - see AuthEntity's own comment on why this
  // exists instead of a registration step filling it in first.
  createProfile(phone: string): Promise<AuthEntity> {
    return this.profileRepository.save(
      this.profileRepository.create({ phone, fName: 'User', lName: null, mail: null, roles: AuthRole.USER }),
    );
  }
}
