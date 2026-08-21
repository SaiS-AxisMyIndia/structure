// DB queries + DB-level validation for payment
const { Payment } = require('../../config/entities');

const create = async (data) => {
  // return Payment.create(data);
  return { id: 'stub-id', status: 'pending', ...data };
};

const findById = async (id) => {
  // return Payment.findById(id);
  return null;
};

const findAll = async () => {
  // return Payment.find();
  return [];
};

module.exports = {
  create,
  findById,
  findAll,
};
