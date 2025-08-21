import User from '../models/User.js';
import Car from '../models/Car.js';
import Category from '../models/Category.js';
import { catchAsync, AppError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Get user profile
export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select('-password -refreshToken -passwordResetToken');
  
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404);
  }

  let profileData = {
    user,
    stats: {
      joinedDate: user.createdAt,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified
    }
  };

  // If user is admin, include their created content
  if (user.role === 'admin') {
    const [categories, cars] = await Promise.all([
      Category.find({ createdBy: req.userId })
        .populate('carCount')
        .sort({ createdAt: -1 })
        .limit(10),
      Car.find({ createdBy: req.userId })
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const [totalCategories, totalCars] = await Promise.all([
      Category.countDocuments({ createdBy: req.userId }),
      Car.countDocuments({ createdBy: req.userId })
    ]);

    profileData.adminData = {
      categories: {
        items: categories,
        total: totalCategories
      },
      cars: {
        items: cars,
        total: totalCars
      }
    };
  }

  logger.info('Profile accessed', {
    userId: req.userId,
    role: user.role
  });

  res.json({
    success: true,
    data: profileData
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res) => {
  const { name, phone } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { name, phone },
    { new: true, runValidators: true }
  ).select('-password -refreshToken -passwordResetToken');

  logger.info('Profile updated', {
    userId: req.userId,
    changes: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Profil muvaffaqiyatli yangilandi',
    data: user
  });
});

// Change password
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.userId).select('+password');
  
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404);
  }
  
  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Joriy parol noto\'g\'ri', 400);
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  logger.info('Password changed', {
    userId: req.userId
  });
  
  res.json({
    success: true,
    message: 'Parol muvaffaqiyatli o\'zgartirildi'
  });
});

// Upload profile image
export const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Rasm fayli yuborilmadi', 400);
  }
  
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { profileImage: imageUrl },
    { new: true }
  ).select('-password -refreshToken -passwordResetToken');
  
  logger.info('Profile image updated', {
    userId: req.userId,
    imageUrl
  });
  
  res.json({
    success: true,
    message: 'Profil rasmi yangilandi',
    imageUrl,
    data: user
  });
});

// Get admin dashboard data
export const getAdminDashboard = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Admin huquqi talab qilinadi', 403);
  }

  const [
    totalCategories,
    totalCars,
    myCategories,
    myCars,
    recentCategories,
    recentCars
  ] = await Promise.all([
    Category.countDocuments({ createdBy: req.userId }),
    Car.countDocuments({ createdBy: req.userId }),
    Category.countDocuments({ createdBy: req.userId, isActive: true }),
    Car.countDocuments({ createdBy: req.userId, isAvailable: true }),
    Category.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('carCount'),
    Car.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name')
  ]);

  const dashboardData = {
    stats: {
      totalCategories,
      totalCars,
      activeCategories: myCategories,
      availableCars: myCars
    },
    recent: {
      categories: recentCategories,
      cars: recentCars
    }
  };

  logger.info('Admin dashboard accessed', {
    userId: req.userId
  });

  res.json({
    success: true,
    data: dashboardData
  });
});
