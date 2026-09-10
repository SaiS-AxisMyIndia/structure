import { Body, Controller, Headers, Post } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Public } from '../../../config/decorators/public.decorator.js';
import { CurrentUser } from '../../../config/decorators/current-user.decorator.js';
import type { TokenPayload } from '../../../config/auth/token.service.js';
import { AuthService, GenerateOtpResponse, LogoutResponse, RefreshTokenResponse, VerifyOtpResponse } from './auth.service.js';
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

@Controller('user/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('generate-otp')
  generateOtp(@Body() body: GenerateOtpDto): Promise<Packet<GenerateOtpResponse>> {
    return this.authService.generateOtp(body.identifier, body.deviceId);
  }

  @Public()
  @Post('validate-otp')
  validateOtp(
    @Body() body: ValidateOtpDto,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<Packet<VerifyOtpResponse>> {
    return this.authService.verifyOtp(body.identifier, body.otp, body.deviceId, deviceName ?? 'Unknown Device');
  }

  @Public()
  @Post('refresh-token')
  refreshToken(@Body() body: RefreshTokenDto): Promise<Packet<RefreshTokenResponse>> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser() user: TokenPayload): Promise<Packet<LogoutResponse>> {
    return this.authService.logout(user.id, user.did);
  }

  @Post('logoutAll')
  logoutAll(@CurrentUser() user: TokenPayload): Promise<Packet<LogoutResponse>> {
    return this.authService.logoutAll(user.id);
  }
}
