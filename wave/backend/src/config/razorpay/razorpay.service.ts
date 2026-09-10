import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderInput, CreateOrderResult, VerifyPaymentInput } from './razorpay.types.js';

// Thin wrapper around the Razorpay SDK - a service that needs to take a
// payment injects this, never the `razorpay` package directly, so swapping
// providers (or mocking this in a unit test) only ever touches this one
// file. Stubbed until the `razorpay` package is installed and
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set - every method logs and
// returns a plausible fake result instead of calling out.
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    this.logger.warn('RazorpayService.createOrder is a stub - wire the real SDK before going live.');
    return {
      orderId: `stub_order_${Date.now()}`,
      amount: input.amount,
      currency: input.currency,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    this.logger.warn('RazorpayService.verifyPayment is a stub - wire the real SDK before going live.');
    return Boolean(input.orderId && input.paymentId && input.signature);
  }
}
