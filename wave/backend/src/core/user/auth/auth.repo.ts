import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthOtpEntity } from '../../../config/entities/auth-otp.entity.js';
import { AuthEntity, AuthRole } from '../../../config/entities/auth.entity.js';
import { DeviceEntity } from '../../../config/entities/device.entity.js';
import { ContactFormatter } from '../../../config/utils/contactFormatter.js';

@Injectable()
export class AuthRepo {
  constructor(
    @InjectRepository(AuthOtpEntity) private readonly otpRepository: Repository<AuthOtpEntity>,
    @InjectRepository(AuthEntity) private readonly profileRepository: Repository<AuthEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepository: Repository<DeviceEntity>,
  ) {}

  async saveOtp(phone: string, code: number, deviceId: string): Promise<void> {
    await this.otpRepository.save(this.otpRepository.create({ phone, otp: code, deviceId, attempts: 0 }));
  }

  findOtp(phone: string, deviceId: string): Promise<AuthOtpEntity | null> {
    return this.otpRepository.findOne({ where: { phone, deviceId }, order: { createdAt: 'DESC' } });
  }

  async incrementOtpAttempts(id: number): Promise<void> {
    await this.otpRepository.increment({ id }, 'attempts', 1);
  }

  async deleteOtp(phone: string): Promise<void> {
    await this.otpRepository.delete({ phone });
  }

  findProfileByPhone(phone: string): Promise<AuthEntity | null> {
    return this.profileRepository.findOneBy({ phone });
  }

  findProfileById(id: string): Promise<AuthEntity | null> {
    return this.profileRepository.findOneBy({ id });
  }

  createProfile(phone: string): Promise<AuthEntity> {
    const mail = ContactFormatter.isEmail(phone) ? phone : null;
    return this.profileRepository.save(
      this.profileRepository.create({ phone, fName: 'User', lName: null, mail, roles: AuthRole.USER, blocked: false }),
    );
  }

  async upsertDevice(authId: string, deviceId: string, name: string | null): Promise<void> {
    const existing = await this.deviceRepository.findOneBy({ authId, deviceId });
    await this.deviceRepository.save({ ...existing, authId, deviceId, name, active: true });
  }

  async deactivateDevice(authId: string, deviceId: string): Promise<void> {
    await this.deviceRepository.update({ authId, deviceId }, { active: false });
  }

  async deactivateAllDevices(authId: string): Promise<void> {
    await this.deviceRepository.update({ authId }, { active: false });
  }

  async isDeviceActive(authId: string, deviceId: string): Promise<boolean> {
    const device = await this.deviceRepository.findOneBy({ authId, deviceId });
    return device?.active ?? false;
  }
}
