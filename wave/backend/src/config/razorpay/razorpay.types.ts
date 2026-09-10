export type CreateOrderInput = {
  // Smallest currency unit - paise for INR, cents for USD, etc. - same
  // convention Razorpay's own API uses.
  amount: number;
  currency: string;
  receipt: string;
};

export type CreateOrderResult = {
  orderId: string;
  amount: number;
  currency: string;
};

export type VerifyPaymentInput = {
  orderId: string;
  paymentId: string;
  signature: string;
};
