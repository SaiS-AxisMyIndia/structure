import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from '../../core/admin/auth/auth.controller.js';
import { AdminAuthService } from '../../core/admin/auth/auth.service.js';
import { AuthRepo } from '../../core/user/auth/auth.repo.js';
import { AuthOtpEntity } from '../entities/auth-otp.entity.js';
import { AuthEntity } from '../entities/auth.entity.js';
import { DeviceEntity } from '../entities/device.entity.js';
import { SmsModule } from '../sms/sms.module.js';
import { MailModule } from '../mail/mail.module.js';

// Admin login/session over the exact same auth/auth_otp/devices tables as
// core/user/auth (config/modules/auth.module.ts) - AuthRepo is the same
// class from core/user/auth/auth.repo.ts, not a duplicate, registered as
// its own provider here (TypeOrmModule.forFeature can be registered in
// more than one module for the same entities - each just gets its own
// working Repository<T> instance backed by the same table).
@Module({
  imports: [TypeOrmModule.forFeature([AuthOtpEntity, AuthEntity, DeviceEntity]), SmsModule, MailModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AuthRepo],
})
export class CoreAdminAuthModule {}
