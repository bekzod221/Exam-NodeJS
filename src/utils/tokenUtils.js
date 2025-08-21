import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from './errorHandler.js';

// Generate access token (short-lived)
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET || 'access-secret-key',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
};

// Generate token pair
export const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret-key');
    if (decoded.type !== 'access') {
      throw new AppError('Noto\'g\'ri token turi', 401);
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token muddati tugagan', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Noto\'g\'ri access token', 401);
    }
    throw error;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret-key');
    if (decoded.type !== 'refresh') {
      throw new AppError('Noto\'g\'ri token turi', 401);
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token muddati tugagan', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Noto\'g\'ri refresh token', 401);
    }
    throw error;
  }
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  return { resetToken, hashedToken };
};

// Hash password reset token
export const hashPasswordResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
