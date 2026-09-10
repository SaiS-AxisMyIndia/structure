import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PacketInterceptor } from './config/http/packet.interceptor.js';
import { PacketExceptionFilter } from './config/http/packet.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Basic validation for every route: DTOs declare their own
  // class-validator decorators, this is what actually enforces them -
  // strips unknown fields (whitelist) and turns plain request bodies into
  // real class instances (transform) so a DTO's own methods/getters work.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Every response - success or thrown - goes out as a Packet (see
  // config/http/packet.ts), matching the frontend's own DataResponse
  // envelope so SecureCall can unwrap it without each controller
  // hand-building { success, data } itself.
  app.useGlobalInterceptors(new PacketInterceptor());
  app.useGlobalFilters(new PacketExceptionFilter());
  await app.listen(process.env.PORT ?? 5050);
}
await bootstrap();
