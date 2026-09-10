import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '../../core/auth/auth.controller.js';
import { AuthService } from '../../core/auth/auth.service.js';
import { AuthRepo } from '../../core/auth/auth.repo.js';
import { AuthOtpEntity } from '../database/entities/auth-otp.entity.js';
import { AuthEntity } from '../database/entities/auth.entity.js';
import { SmsModule } from '../sms/sms.module.js';

// Named CoreAuthModule (not AuthModule) to keep it distinct from
// config/auth/token.module.ts's TokenModule - that one is the cross-cutting
// JWT/session piece every feature can use, this one is the login/OTP
// feature itself. Lives under config/modules/ rather than next to
// AuthController/AuthService/AuthRepo in core/auth/ - those stay
// controller/service/repo only, module wiring for this feature is kept
// here instead.
//
// TypeOrmModule.forFeature registers the repositories AuthRepo injects
// (see its own @InjectRepository calls) - the entity classes themselves
// live under config/database/entities/, DatabaseModule's
// `autoLoadEntities` is what actually wires them into the DB connection.
// SmsModule isn't @Global() (unlike TokenModule) so it has to be imported
// explicitly here for AuthService's own SmsService injection to resolve.
@Module({
  imports: [TypeOrmModule.forFeature([AuthOtpEntity, AuthEntity]), SmsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepo],
})
export class CoreAuthModule {}
