import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAdminAuth = async (req, res, next) => {
  try {
    const adminToken = req.cookies.adminToken;

    if (!adminToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin autentifikatsiyasi talab qilinadi' 
      });
    }

    // Verify admin token
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get admin from database
    const admin = await User.findById(decoded.userId).select('-password -verificationCode');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin foydalanuvchi topilmadi' 
      });
    }

    // Check if user is admin
    if (admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin huquqi talab qilinadi' 
      });
    }

    // Check if admin is verified
    if (!admin.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin hisobi tasdiqlanmagan' 
      });
    }

    // Add admin to request
    req.admin = admin;
    req.adminId = admin._id;
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Noto\'g\'ri admin token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin token muddati tugagan' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server xatosi' 
    });
  }
};

export const optionalAdminAuth = async (req, res, next) => {
  try {
    const adminToken = req.cookies.adminToken;

    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'your-secret-key');
      const admin = await User.findById(decoded.userId).select('-password -verificationCode');
      
      if (admin && admin.role === 'admin' && admin.isVerified) {
        req.admin = admin;
        req.adminId = admin._id;
      }
    }

    next();
  } catch (error) {
    // Continue without admin if token is invalid
    next();
  }
}; 