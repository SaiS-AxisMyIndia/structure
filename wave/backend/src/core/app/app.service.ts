import { Injectable } from '@nestjs/common';
import { AppRepo } from './app.repo.js';

// All business logic lives here - the controller only translates HTTP <->
// service calls (routing, guards, request validation), and AppRepo only
// talks to the data store. A feature that needs a 3rd-party integration
// (Razorpay, mail, SMS, ...) calls it from this layer, injecting the
// matching provider from config/.
@Injectable()
export class AppService {
  constructor(private readonly appRepo: AppRepo) {}

  getHello(): string {
    return this.appRepo.getGreeting();
  }
}
