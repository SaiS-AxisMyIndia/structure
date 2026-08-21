class CreatePaymentRequestDto {
  constructor({ amount, currency }) {
    this.amount = amount;
    this.currency = currency;
  }
}

class PaymentResponseDto {
  constructor({ id, amount, currency, status }) {
    this.id = id;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
  }
}

module.exports = {
  CreatePaymentRequestDto,
  PaymentResponseDto,
};
