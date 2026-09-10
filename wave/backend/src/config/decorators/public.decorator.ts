import { SetMetadata } from '@nestjs/common';

// Route-level escape hatch from JwtAuthGuard (registered as the global
// APP_GUARD in app.module.ts) - every route requires a valid access token
// by default, so anything that must be reachable without one (login,
// generate-otp, verify-otp, health checks, ...) has to opt out explicitly
// with this rather than the other way around.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
