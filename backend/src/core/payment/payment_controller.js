const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const ApiResponse = require('../../config/utils/apiResponse');
const asyncHandler = require('../../config/utils/asyncHandler');
const paymentService = require('./payment_service');

const create = asyncHandler(async (req, res) => {
  const payment = await paymentService.create(req.body);
  return new ApiResponse(httpStatus.CREATED, messages.PAYMENT.CREATED, payment).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getById(req.params.id);
  return new ApiResponse(httpStatus.OK, 'Payment fetched successfully', payment).send(res);
});

const getAll = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAll();
  return new ApiResponse(httpStatus.OK, 'Payments fetched successfully', payments).send(res);
});

module.exports = {
  create,
  getById,
  getAll,
};
