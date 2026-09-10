import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

// JwtSignOptions['expiresIn'] is `number | StringValue` - StringValue is a
// branded template-literal type (from the `ms` package) that a plain
// env-sourced `string` can never statically satisfy, even though any
// actual value read from JWT_*_EXPIRES_IN (e.g. '15m') matches it fine at
// runtime. This local alias documents that gap at its one call site below
// instead of casting inline with no explanation.
type ExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

// Whatever a caller wants encoded into the token - kept deliberately
// minimal (id/role/did, not e.g. mail/phone - a JWT is base64, not
// encrypted, so anything in here is readable by whoever holds the token).
// `id`/`role`/`did` are the fields every payload is expected to carry
// (see AuthService.verifyOtp); anything else is feature-specific.
export type TokenPayload = { id: string; role: string; did: string; [key: string]: unknown };

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

// The one place that knows how access/refresh tokens are signed and
// verified - JwtAuthGuard (session on incoming requests) and any
// login/refresh flow (session on the way out) both go through this instead
// of touching JwtService or the secrets directly. Two different secrets/
// expiries (not just two different `expiresIn`s off one secret) so a
// leaked access token can't be replayed as a refresh token.
@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  private get accessSecret(): string {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  }

  private get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
  }

  private get accessExpiresIn(): ExpiresIn {
    return (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as ExpiresIn;
  }

  private get refreshExpiresIn(): ExpiresIn {
    return (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as ExpiresIn;
  }

  signAccessToken(payload: TokenPayload): string {
    // notBefore: 0 - not needed functionally (a token with no `nbf` is
    // already valid immediately), but makes the claim actually appear in
    // the decoded payload rather than being silently absent.
    return this.jwtService.sign(payload, { secret: this.accessSecret, expiresIn: this.accessExpiresIn, notBefore: 0 });
  }

  signRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn, notBefore: 0 });
  }

  // What a login/OTP-verify/refresh endpoint hands back to the client -
  // matches the { accessToken, refreshToken } shape the frontend already
  // expects from its own (currently mocked) auth flow.
  issueSession(payload: TokenPayload): SessionTokens {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, { secret: this.accessSecret });
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, { secret: this.refreshSecret });
  }
}
