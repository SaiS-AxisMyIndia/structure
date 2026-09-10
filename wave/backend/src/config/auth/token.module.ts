import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';

// @Global() so any core feature module can inject TokenService (to issue a
// session) or use JwtAuthGuard (to require one) without importing this
// module itself - token/session handling is cross-cutting, not owned by
// any one feature. JwtModule.register({}) with no options: TokenService
// always passes its own secret/expiresIn per call (see its own comment),
// so JwtService's own defaults are never used.
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, JwtAuthGuard],
  exports: [TokenService, JwtAuthGuard],
})
export class TokenModule {}
