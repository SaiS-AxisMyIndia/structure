import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { TokenPayload } from '../auth/token.service.js';

// JwtAuthGuard attaches the decoded access-token payload to `request.user`
// once it passes verification - this just reads it back out so a
// controller can do `@CurrentUser() user: TokenPayload` instead of digging
// into the raw request itself.
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): TokenPayload | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: TokenPayload }>();
  return request.user;
});
