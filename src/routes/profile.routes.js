import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.js';
import { updateProfileSchema } from '../validation/schemas.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getAdminDashboard
} from '../controller/profile.controller.js';

const profileRouter = Router();

// All profile routes require authentication
profileRouter.use(requireAuth);

// Get user profile
profileRouter.get('/', getProfile);

// Update user profile
profileRouter.put('/update',
  validate(updateProfileSchema),
  updateProfile
);

// Change password
profileRouter.put('/change-password', changePassword);

// Upload profile image
profileRouter.post('/upload-image',
  upload.single('profileImage'),
  uploadProfileImage
);

// Admin dashboard (Admin only)
profileRouter.get('/admin/dashboard',
  requireAdmin,
  getAdminDashboard
);

export { profileRouter };
