// Combines all v1 routes
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const paymentRoutes = require('./payment.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
