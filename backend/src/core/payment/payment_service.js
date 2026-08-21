// Business logic for payment, calls repo
const ApiError = require('../../config/utils/apiError');
const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const paymentRepo = require('./payment_repo');

const create = async (data) => paymentRepo.create(data);

const getById = async (id) => {
  const payment = await paymentRepo.findById(id);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, messages.PAYMENT.NOT_FOUND);
  }
  return payment;
};

const getAll = async () => paymentRepo.findAll();

module.exports = {
  create,
  getById,
  getAll,
};
