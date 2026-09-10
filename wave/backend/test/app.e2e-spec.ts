import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PacketInterceptor } from '../src/config/http/packet.interceptor.js';
import { PacketExceptionFilter } from '../src/config/http/packet.filter.js';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors main.ts's own bootstrap() - this app instance is built by
    // hand (not via NestFactory.create + main.ts), so none of that applies
    // automatically.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new PacketInterceptor());
    app.useGlobalFilters(new PacketExceptionFilter());
    await app.init();
  });

  it('rejects a protected route with no bearer token', () => {
    return request(app.getHttpServer())
      .post('/user/v1/auth/logout')
      .expect(401)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
