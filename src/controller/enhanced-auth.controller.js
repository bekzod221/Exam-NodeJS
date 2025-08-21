import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sendVerificationCode, sendPasswordResetEmail } from '../config/email.js';
import logger from '../config/logger.js';

export const register = catchAsync(async (req, res) => {
  const { email, password, name, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Bu email allaqachon ro\'yxatdan o\'tgan', 400);
  }

  const user = new User({
    email,
    password,
    name,
    phone
  });

  const code = user.generateVerificationCode();
  await user.save();

  const emailSent = await sendVerificationCode(email, code);
  
  if (!emailSent) {
    logger.error('Failed to send verification email', {
      email,
      userId: user._id
    });
    throw new AppError('Email yuborishda xatolik yuz berdi', 500);
  }

  logger.info('User registered', {
    userId: user._id,
    email,
    name
  });

  res.status(201).json({
    success: true,
    message: 'Foydalanuvchi yaratildi. Autentifikatsiya kodi emailingizga yuborildi'
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    logger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    throw new AppError('Email yoki parol noto\'g\'ri', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Email tasdiqlash talab qilinadi', 403);
  }

  // Generate token pair
  const { accessToken, refreshToken } = generateTokenPair(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logger.info('User logged in', {
    userId: user._id,
    email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Muvaffaqiyatli kirildi',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    }
  });
});

export const verifyCode = catchAsync(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404);
  }

  const isValid = user.verifyCode(code);
  
  if (!isValid) {
    throw new AppError('Noto\'g\'ri kod yoki kod muddati tugagan', 400);
  }

  // Generate token pair
  const { accessToken, refreshToken } = generateTokenPair(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logger.info('Email verified and user logged in', {
    userId: user._id,
    email
  });

  res.json({
    success: true,
    message: 'Email tasdiqlandi va tizimga kirildi',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.cookies;

  if (!token) {
    throw new AppError('Refresh token topilmadi', 401);
  }

  const decoded = verifyRefreshToken(token);
  
  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== token) {
    throw new AppError('Noto\'g\'ri refresh token', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logger.info('Token refreshed', {
    userId: user._id
  });

  res.json({
    success: true,
    message: 'Token yangilandi',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Bu email bilan foydalanuvchi topilmadi', 404);
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.passwordResetToken = user.createPasswordResetToken();
  user.verificationCode = {
    code: resetCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  await user.save();

  const emailSent = await sendPasswordResetEmail(email, resetCode);
  
  if (!emailSent) {
    user.passwordResetToken = undefined;
    user.verificationCode = undefined;
    await user.save();
    
    logger.error('Failed to send password reset email', {
      email,
      userId: user._id
    });
    throw new AppError('Email yuborishda xatolik yuz berdi', 500);
  }

  logger.info('Password reset code sent', {
    userId: user._id,
    email
  });

  res.json({
    success: true,
    message: 'Parolni tiklash kodi emailingizga yuborildi'
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404);
  }

  if (!user.verificationCode || 
      user.verificationCode.code !== code || 
      user.verificationCode.expiresAt < new Date()) {
    throw new AppError('Noto\'g\'ri kod yoki kod muddati tugagan', 400);
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.verificationCode = undefined;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  logger.info('Password reset successfully', {
    userId: user._id,
    email
  });

  res.json({
    success: true,
    message: 'Parol muvaffaqiyatli o\'zgartirildi'
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');
  
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Joriy parol noto\'g\'ri', 400);
  }

  // Update password
  user.password = newPassword;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  logger.info('Password changed', {
    userId: user._id
  });

  res.json({
    success: true,
    message: 'Parol muvaffaqiyatli o\'zgartirildi'
  });
});

export const logout = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { refreshToken: undefined });

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info('User logged out', {
    userId: req.userId
  });

  res.json({
    success: true,
    message: 'Muvaffaqiyatli chiqildi'
  });
});

export const getCurrentUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select('-password -refreshToken -passwordResetToken');
  
  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

export const sendCode = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Bu email bilan foydalanuvchi topilmadi', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email allaqachon tasdiqlangan', 400);
  }

  const code = user.generateVerificationCode();
  await user.save();

  const emailSent = await sendVerificationCode(email, code);
  
  if (!emailSent) {
    throw new AppError('Email yuborishda xatolik yuz berdi', 500);
  }

  logger.info('Verification code resent', {
    userId: user._id,
    email
  });

  res.json({
    success: true,
    message: 'Autentifikatsiya kodi emailingizga yuborildi'
  });
});
