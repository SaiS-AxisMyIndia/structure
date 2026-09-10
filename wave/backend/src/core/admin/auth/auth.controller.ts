import { Body, Controller, Headers, Post } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Public } from '../../../config/decorators/public.decorator.js';
import { CurrentUser } from '../../../config/decorators/current-user.decorator.js';
import type { TokenPayload } from '../../../config/auth/token.service.js';
import {
  AdminAuthService,
  AdminLogoutResponse,
  GenerateAdminOtpResponse,
  RefreshAdminTokenResponse,
  VerifyAdminOtpResponse,
} from './auth.service.js';
import { Packet } from '../../../config/http/packet.js';

class GenerateOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

class ValidateOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsNumber()
  otp!: number;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

@Controller('admin/v1/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('generate-otp')
  generateOtp(@Body() body: GenerateOtpDto): Promise<Packet<GenerateAdminOtpResponse>> {
    return this.adminAuthService.generateOtp(body.identifier, body.deviceId);
  }

  @Public()
  @Post('validate-otp')
  validateOtp(
    @Body() body: ValidateOtpDto,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<Packet<VerifyAdminOtpResponse>> {
    return this.adminAuthService.verifyOtp(body.identifier, body.otp, body.deviceId, deviceName ?? 'Unknown Device');
  }

  @Public()
  @Post('refresh-token')
  refreshToken(@Body() body: RefreshTokenDto): Promise<Packet<RefreshAdminTokenResponse>> {
    return this.adminAuthService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser() user: TokenPayload): Promise<Packet<AdminLogoutResponse>> {
    return this.adminAuthService.logout(user.id, user.did);
  }

  @Post('logoutAll')
  logoutAll(@CurrentUser() user: TokenPayload): Promise<Packet<AdminLogoutResponse>> {
    return this.adminAuthService.logoutAll(user.id);
  }
}
