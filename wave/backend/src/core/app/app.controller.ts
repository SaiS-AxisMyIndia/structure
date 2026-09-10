import { Controller, Get } from '@nestjs/common';
import { Public } from '../../config/decorators/public.decorator.js';
import { AppService } from './app.service.js';

// Controllers only ever: wire routes, apply guards/middleware (JwtAuthGuard
// is global by default - see app.module.ts - so @Public() is the one thing
// a route here needs to opt out of it), and validate the request (DTOs +
// the global ValidationPipe from main.ts). No business logic - that's
// AppService's job.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
