import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
      include: { items: { include: { product: true } } }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'Order already paid' });

    // ── KEY FIX: If Razorpay order already exists, return it directly ──
    // This handles page refreshes without creating a duplicate receipt error
    if (order.razorpayOrderId) {
      return res.json({
        razorpayOrderId: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: order.currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: order.currency || 'INR',
      receipt:  `rcpt_${order.id.slice(0, 30)}`, // max 40 chars
      notes:    { orderId: order.id, userId: req.user.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data:  { razorpayOrderId: razorpayOrder.id }
    });

    return res.json({
      razorpayOrderId: razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err?.error || err);
    const msg = err?.error?.description || 'Failed to create payment order';
    return res.status(500).json({ error: msg });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // HMAC SHA256 signature check
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature mismatch' });
    }

    // Double-check with Razorpay API
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({ error: 'Payment not captured' });
    }

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId: req.user.id }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId:     razorpay_payment_id,
        paymentStatus: 'PAID',
        paymentMethod: payment.method || 'upi',
        status:        'CONFIRMED',
        trackingId:    `TRK${Date.now()}`,
      },
    });

    return res.json({
      success: true,
      order: {
        id:            updated.id,
        status:        updated.status,
        paymentStatus: updated.paymentStatus,
        trackingId:    updated.trackingId,
        paymentId:     updated.paymentId,
      }
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payments/poll-status
router.post('/poll-status', authenticate, async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId, userId: req.user.id }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Already confirmed in DB — no need to call Razorpay
    if (order.paymentStatus === 'PAID') {
      return res.json({ status: 'PAID', paymentId: order.paymentId });
    }

    const rzpPayments = await razorpay.orders.fetchPayments(razorpayOrderId);

    if (rzpPayments.items?.length > 0) {
      const payment = rzpPayments.items[0];

      if (payment.status === 'captured') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId:     payment.id,
            paymentStatus: 'PAID',
            paymentMethod: payment.method,
            status:        'CONFIRMED',
            trackingId:    `TRK${Date.now()}`,
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

    return res.json({ status: order.paymentStatus });
  } catch (err) {
    console.error('Poll status error:', err);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
