import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TokenModule } from './config/auth/token.module.js';
import { JwtAuthGuard } from './config/guards/jwt-auth.guard.js';
import { DatabaseModule } from './config/database/database.module.js';
import { RazorpayModule } from './config/razorpay/razorpay.module.js';
import { MailModule } from './config/mail/mail.module.js';
import { SmsModule } from './config/sms/sms.module.js';
import { MiddlewaresModule } from './config/middlewares/middlewares.module.js';
import { CoreAuthModule } from './config/modules/auth.module.js';
import { CoreAdminAuthModule } from './config/modules/admin-auth.module.js';

// Composition root only - route/business logic lives in core/, 3rd-party
// integrations and shared middleware live in config/. This file just wires
// them together and registers the global request guard.
@Module({
  imports: [
    TokenModule,
    DatabaseModule,
    RazorpayModule,
    MailModule,
    SmsModule,
    MiddlewaresModule,
    CoreAuthModule,
    CoreAdminAuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
