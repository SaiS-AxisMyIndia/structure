// Payment entity/schema definition
// Example (mongoose):
// const mongoose = require('mongoose');
//
// const paymentSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     amount: { type: Number, required: true },
//     currency: { type: String, default: 'USD' },
//     status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
//   },
//   { timestamps: true }
// );
//
// module.exports = mongoose.model('Payment', paymentSchema);

module.exports = {};
