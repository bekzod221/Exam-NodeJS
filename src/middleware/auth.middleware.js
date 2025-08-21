import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Enhanced auth middleware with access token
export const requireAuth = catchAsync(async (req, res, next) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AppError('Autentifikatsiya talab qilinadi', 401);
  }

  // Verify access token
  const decoded = verifyAccessToken(token);
  
  // Get user from database
  const user = await User.findById(decoded.userId).select('-password -refreshToken -passwordResetToken');
  
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 401);
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new AppError('Email tasdiqlash talab qilinadi', 403);
  }

  // Add user to request
  req.user = user;
  req.userId = user._id;
  
  logger.debug('User authenticated', {
    userId: user._id,
    email: user.email,
    role: user.role
  });
  
  next();
});

// Optional auth middleware
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshToken -passwordResetToken');
      
      if (user && user.isVerified) {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Role-based access control
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Autentifikatsiya talab qilinadi', 401);
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl
      });
      throw new AppError('Bu amalni bajarish uchun ruxsat yo\'q', 403);
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole('admin');

// User or Admin middleware
export const requireUserOrAdmin = requireRole('user', 'admin');

// Check if user owns resource or is admin
export const requireOwnershipOrAdmin = (getResourceUserId) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Autentifikatsiya talab qilinadi', 401);
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource owner ID
    const resourceUserId = await getResourceUserId(req);
    
    if (!resourceUserId || resourceUserId.toString() !== req.userId.toString()) {
      logger.warn('Access denied - not owner', {
        userId: req.userId,
        resourceUserId,
        url: req.originalUrl
      });
      throw new AppError('Bu resursga kirish huquqingiz yo\'q', 403);
    }

    next();
  });
}; 