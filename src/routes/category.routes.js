import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.js';
import { categorySchema, updateCategorySchema, paginationSchema } from '../validation/schemas.js';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCarsByCategory
} from '../controller/category.controller.js';

const categoryRouter = Router();

// Public routes
categoryRouter.get('/', 
  validate(paginationSchema, 'query'),
  optionalAuth,
  getCategories
);

categoryRouter.get('/:id', 
  optionalAuth,
  getCategory
);

categoryRouter.get('/:id/cars',
  validate(paginationSchema, 'query'),
  optionalAuth,
  getCarsByCategory
);

// Protected routes (Admin only)
categoryRouter.use(requireAuth);

categoryRouter.post('/',
  requireAdmin,
  uploadSingle('image'),
  validate(categorySchema),
  createCategory
);

categoryRouter.put('/:id',
  requireAdmin,
  uploadSingle('image'),
  validate(updateCategorySchema),
  updateCategory
);

categoryRouter.delete('/:id',
  requireAdmin,
  deleteCategory
);

export { categoryRouter };
