import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const addressValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().matches(/^[+]?[\d\s\-()]{8,15}$/).withMessage('Valid phone number required'),
  body('houseNumber').trim().notEmpty().withMessage('House number is required'),
  body('addressLine').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
];

// GET /api/addresses
router.get('/', authenticate, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/addresses
router.post('/', authenticate, addressValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullName, phone, houseNumber, addressLine, landmark, city, state, country, postalCode } = req.body;

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        houseNumber,
        addressLine,
        landmark: landmark || null,
        city,
        state,
        country,
        postalCode
      }
    });

    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;
