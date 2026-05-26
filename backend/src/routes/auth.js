import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from '../lib/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user by googleId OR email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, name, avatar: picture }
      });
    } else {
      user = await prisma.user.create({
        data: { googleId, email, name, avatar: picture }
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, refreshToken: token }
    });

    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (err) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });
    clearRefreshTokenCookie(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
