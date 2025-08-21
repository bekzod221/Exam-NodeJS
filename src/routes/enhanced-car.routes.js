import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth, requireOwnershipOrAdmin } from '../middleware/auth.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.js';
import { carSchema, updateCarSchema, carSearchSchema } from '../validation/schemas.js';
import {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  bulkUpdateCars,
  bulkDeleteCars
} from '../controller/enhanced-car.controller.js';

const carRouter = Router();

// Public routes
carRouter.get('/', 
  validate(carSearchSchema, 'query'),
  optionalAuth,
  getCars
);

carRouter.get('/:id', 
  optionalAuth,
  getCar
);

// Protected routes
carRouter.use(requireAuth);

// Create car (Admin only)
carRouter.post('/',
  requireAdmin,
  uploadMultiple('images', 5),
  validate(carSchema),
  createCar
);

// Update car (Admin or owner)
carRouter.put('/:id',
  uploadMultiple('images', 5),
  validate(updateCarSchema),
  requireOwnershipOrAdmin(async (req) => {
    const Car = (await import('../models/Car.js')).default;
    const car = await Car.findById(req.params.id);
    return car?.createdBy;
  }),
  updateCar
);

// Delete car (Admin or owner)
carRouter.delete('/:id',
  requireOwnershipOrAdmin(async (req) => {
    const Car = (await import('../models/Car.js')).default;
    const car = await Car.findById(req.params.id);
    return car?.createdBy;
  }),
  deleteCar
);

// Bulk operations (Admin only)
carRouter.post('/bulk/update',
  requireAdmin,
  bulkUpdateCars
);

carRouter.post('/bulk/delete',
  requireAdmin,
  bulkDeleteCars
);

export { carRouter };
