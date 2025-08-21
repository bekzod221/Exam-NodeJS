import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.js';
import { RATE_LIMITS } from '../utils/constants.js';
import {
  registerSchema,
  loginSchema,
  verifyCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validation/schemas.js';
import {
  register,
  login,
  verifyCode,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getCurrentUser,
  sendCode
} from '../controller/enhanced-auth.controller.js';

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring'
  }
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.WINDOW_MS,
  max: RATE_LIMITS.LOGIN.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin qayta urinib ko\'ring'
  }
});

const authRouter = Router();

// Apply rate limiting to sensitive endpoints
authRouter.use('/register', authLimiter);
authRouter.use('/login', loginLimiter);
authRouter.use('/forgot-password', authLimiter);
authRouter.use('/reset-password', authLimiter);

// Public routes
authRouter.post('/register', 
  validate(registerSchema),
  register
);

authRouter.post('/login',
  validate(loginSchema),
  login
);

authRouter.post('/verify',
  validate(verifyCodeSchema),
  verifyCode
);

authRouter.post('/send-code',
  validate(forgotPasswordSchema),
  sendCode
);

authRouter.post('/refresh-token',
  refreshToken
);

authRouter.post('/forgot-password',
  validate(forgotPasswordSchema),
  forgotPassword
);

authRouter.post('/reset-password',
  validate(resetPasswordSchema),
  resetPassword
);

// Protected routes
authRouter.use(requireAuth);

authRouter.post('/change-password',
  validate(changePasswordSchema),
  changePassword
);

authRouter.post('/logout',
  logout
);

authRouter.get('/me',
  getCurrentUser
);

export { authRouter };
