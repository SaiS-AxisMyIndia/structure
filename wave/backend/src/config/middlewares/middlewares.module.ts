import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from './request-logger.middleware.js';

// Package for cross-cutting request middleware, same idea as razorpay/mail/
// sms next to it - add another one here (rate limiting, request-id
// tagging, ...) and register it below rather than reaching into core/ to
// wire it in by hand.
@Module({})
export class MiddlewaresModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
