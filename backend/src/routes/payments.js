import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-order - Create Razorpay order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Convert amount to paise (INR) - Razorpay expects smallest currency unit
    const amountInPaise = Math.round(order.totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: order.currency || 'INR',
      receipt: `receipt_${order.id}`,
      notes: {
        orderId: order.id,
        userId: req.user.id
      },
      payment_capture: 1
    });

    // Update order with razorpay order ID
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify - Verify payment (server-side)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature (HMAC SHA256)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Fetch payment from Razorpay API to double-verify
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({ error: 'Payment not captured' });
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order - store only metadata, never sensitive payment info
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: razorpay_payment_id, // Transaction ID only
        paymentStatus: 'PAID',
        paymentMethod: payment.method || 'upi',
        status: 'CONFIRMED',
        trackingId: `TRK${Date.now()}`
      },
      include: {
        items: { include: { product: true } },
        address: true
      }
    });

    res.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        trackingId: updatedOrder.trackingId,
        paymentId: updatedOrder.paymentId,
        createdAt: updatedOrder.createdAt
      }
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payments/poll-status - Poll payment status
router.post('/poll-status', authenticate, async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId, userId: req.user.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check with Razorpay
    const razorpayPayments = await razorpay.orders.fetchPayments(razorpayOrderId);
    
    if (razorpayPayments.items && razorpayPayments.items.length > 0) {
      const payment = razorpayPayments.items[0];
      
      if (payment.status === 'captured') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId: payment.id,
            paymentStatus: 'PAID',
            paymentMethod: payment.method,
            status: 'CONFIRMED',
            trackingId: `TRK${Date.now()}`
          }
        });

        return res.json({ status: 'PAID', paymentId: payment.id });
      }

      if (payment.status === 'failed') {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' }
        });
        return res.json({ status: 'FAILED' });
      }
    }

    res.json({ status: order.paymentStatus });
  } catch (err) {
    console.error('Poll status error:', err);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// GET /api/payments/upi-config - Get UPI merchant config for QR
router.get('/upi-config', authenticate, (req, res) => {
  res.json({
    merchantId: process.env.UPI_MERCHANT_ID || 'merchant@upi',
    merchantName: 'Nexus Hardware'
  });
});

export default router;
