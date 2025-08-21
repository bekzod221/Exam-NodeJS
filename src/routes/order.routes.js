import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdminAuth } from '../middleware/admin.middleware.js';
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  getAllOrders
} from '../controller/order.controller.js';

const orderRouter = Router();

// User routes (require authentication)
orderRouter.use(requireAuth);

// Create order (checkout)
orderRouter.post('/checkout', createOrder);

// Get user's orders
orderRouter.get('/my-orders', getUserOrders);

// Get single order
orderRouter.get('/:orderId', getOrder);

// Cancel order
orderRouter.put('/:orderId/cancel', cancelOrder);

// Admin routes (require admin authentication)
orderRouter.use('/admin', requireAdminAuth);

// Get all orders (admin)
orderRouter.get('/admin/all', getAllOrders);

// Update order status (admin)
orderRouter.put('/admin/:orderId/status', updateOrderStatus);

export { orderRouter };
