import { Body, Controller, Post } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Public } from '../../config/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { Packet } from '../../config/http/packet.js';

class GenerateOtpDto {
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

class ValidateOtpDto {
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;

  @IsNumber()
  otp!: number;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

@Controller('v1/user/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('generate-otp')
  generateOtp(@Body() body: GenerateOtpDto): Promise<Packet<object>> {
    return this.authService.generateOtp(body.mobileNumber, body.deviceId);
  }

  @Public()
  @Post('validate-otp')
  validateOtp(@Body() body: ValidateOtpDto): Promise<Packet<object>> {
    return this.authService.verifyOtp(body.mobileNumber, body.otp, body.deviceId);
  }
}
