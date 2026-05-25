import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders - Create new order
router.post('/',
  authenticate,
  [
    body('addressId').notEmpty().withMessage('Address is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('currency').optional().isIn(['INR', 'USD', 'GBP', 'EUR', 'AED', 'AUD'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { addressId, items, currency = 'INR', exchangeRate = 1 } = req.body;

      // Verify address belongs to user
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId: req.user.id }
      });

      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      // Fetch products and validate stock
      const productIds = items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({ error: 'One or more products not found' });
      }

      // Calculate total and validate stock
      let totalINR = 0;
      const orderItems = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }

        const itemPrice = product.price * item.quantity;
        totalINR += itemPrice;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price * exchangeRate,
          currency
        });
      }

      const totalInCurrency = totalINR * exchangeRate;

      // Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId: req.user.id,
            addressId,
            totalAmount: currency === 'INR' ? totalINR : totalInCurrency,
            currency,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            items: {
              create: orderItems
            }
          },
          include: {
            items: { include: { product: true } },
            address: true
          }
        });

        // Reduce stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        return newOrder;
      });

      res.status(201).json(order);
    } catch (err) {
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// GET /api/orders - Get user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: { include: { product: true } },
          address: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.order.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
