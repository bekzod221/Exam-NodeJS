import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controller/cart.controller.js';

const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(requireAuth);

// Get user's cart
cartRouter.get('/', getCart);

// Add item to cart
cartRouter.post('/add', addToCart);

// Update cart item quantity
cartRouter.put('/update', updateCartItem);

// Remove item from cart
cartRouter.delete('/remove/:carId', removeFromCart);

// Clear cart
cartRouter.delete('/clear', clearCart);

export { cartRouter };
