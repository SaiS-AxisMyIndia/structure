import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '../../core/user/auth/auth.controller.js';
import { AuthService } from '../../core/user/auth/auth.service.js';
import { AuthRepo } from '../../core/user/auth/auth.repo.js';
import { AuthOtpEntity } from '../entities/auth-otp.entity.js';
import { AuthEntity } from '../entities/auth.entity.js';
import { DeviceEntity } from '../entities/device.entity.js';
import { SmsModule } from '../sms/sms.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuthOtpEntity, AuthEntity, DeviceEntity]), SmsModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepo],
})
export class CoreAuthModule {}
