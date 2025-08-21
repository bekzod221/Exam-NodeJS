import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationCode } from "../config/email.js";
import { sendSuccess, sendError, handleControllerError } from "../utils/responseUtils.js";
import { isValidEmail } from "../utils/validationUtils.js";
import { USER_ROLES, HTTP_STATUS } from "../utils/constants.js";
import { generateAccessToken } from "../utils/tokenUtils.js";

const generateToken = (userId) => {
  return generateAccessToken(userId);
};

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username va parol kiritilishi shart', HTTP_STATUS.BAD_REQUEST);
    }

    // Find admin
    const admin = await User.findOne({
      $or: [{ username }, { email: username }],
      role: USER_ROLES.ADMIN
    }).select('+password');

    if (!admin) {
      return sendError(res, 'Admin topilmadi', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Noto\'g\'ri parol', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if admin is verified
    if (!admin.isVerified) {
      return sendError(res, 'Admin akkaunt tasdiqlanmagan', HTTP_STATUS.FORBIDDEN);
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    // Set cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production'
    });

    // Send success response
    sendSuccess(res, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    }, 'Admin muvaffaqiyatli kirdi');

  } catch (error) {
    handleControllerError(res, error, 'Admin kirishda xatolik');
  }
};

// Admin logout
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie('adminToken');
    res.json({ 
      success: true, 
      message: 'Admin muvaffaqiyatli chiqildi' 
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Add new admin (only super admins can do this)
export const addAdmin = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Barcha maydonlar to\'ldirilishi shart' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu email allaqachon ro\'yxatdan o\'tgan' 
      });
    }

    // Create new admin user
    const adminUser = new User({
      email,
      password,
      name,
      phone,
      role: 'admin',
      isVerified: true // Admin users are auto-verified
    });

    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Admin foydalanuvchi muvaffaqiyatli yaratildi'
    });

  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Login with email and password
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email va parol kiritilishi shart' 
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bu email bilan foydalanuvchi topilmadi' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Noto\'g\'ri parol' 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Email tasdiqlash talab qilinadi. Avval ro\'yxatdan o\'ting' 
      });
    }

    // Update last login and clear existing sessions
    user.lastLogin = new Date();
    user.refreshToken = undefined; // Single session management
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send success response
    res.json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Check authentication status
export const checkAuthStatus = async (req, res) => {
  try {
    // If we reach here, the user is authenticated (middleware already checked)
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Send verification code
export const sendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email kiritilishi shart' 
      });
    }

    // Find user
    let user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bu email bilan foydalanuvchi topilmadi' 
      });
    }

    // Generate verification code
    const code = user.generateVerificationCode();
    await user.save();

    // Send verification code via email
    const emailSent = await sendVerificationCode(email, code);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email yuborishda xatolik yuz berdi' 
      });
    }

    // Send success response
    res.json({ 
      success: true, 
      message: 'Autentifikatsiya kodi emailingizga yuborildi' 
    });

  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Verify code and login
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email va kod kiritilishi shart' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Foydalanuvchi topilmadi' 
      });
    }

    // Verify code
    const isValid = user.verifyCode(code);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Noto\'g\'ri kod yoki kod muddati tugagan' 
      });
    }

    // Mark user as verified and update last login
    user.isVerified = true;
    user.lastLogin = new Date();
    
    // Clear any existing sessions for this user (single session management)
    user.refreshToken = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);
            
    // Set cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Muvaffaqiyatli tasdiqlandi va kirildi',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Barcha maydonlar to\'ldirilishi shart' 
      });
    }

        const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu email allaqachon ro\'yxatdan o\'tgan' 
      });
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
      return res.status(500).json({ 
        success: false, 
        message: 'Email yuborishda xatolik yuz berdi' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Foydalanuvchi yaratildi. Autentifikatsiya kodi emailingizga yuborildi'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

export const logout = async (req, res) => {
  try {
        res.clearCookie('accessToken');
    res.json({ 
      success: true, 
      message: 'Muvaffaqiyatli chiqildi' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -verificationCode');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Foydalanuvchi topilmadi' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};