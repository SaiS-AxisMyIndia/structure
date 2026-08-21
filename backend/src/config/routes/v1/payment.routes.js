const express = require('express');
const paymentController = require('../../../core/payment/payment_controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment endpoints
 */

/**
 * @swagger
 * /v1/payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
router.post('/', paymentController.create);

/**
 * @swagger
 * /v1/payments/{id}:
 *   get:
 *     summary: Get a payment by id
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment found
 *       404:
 *         description: Payment not found
 */
router.get('/:id', paymentController.getById);

/**
 * @swagger
 * /v1/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/', paymentController.getAll);

module.exports = router;
