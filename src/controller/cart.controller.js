import Cart from '../models/Cart.js';
import Car from '../models/Car.js';
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Get user's cart
export const getCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId })
    .populate({
      path: 'items.car',
      select: 'brand model year price images isAvailable category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

  if (!cart) {
    // Create empty cart if doesn't exist
    const newCart = new Cart({ user: req.userId, items: [] });
    await newCart.save();
    return res.json({
      success: true,
      data: newCart
    });
  }

  res.json({
    success: true,
    data: cart
  });
});

// Add item to cart
export const addToCart = catchAsync(async (req, res) => {
  const { carId, quantity = 1 } = req.body;

  if (!carId) {
    throw new AppError('Car ID is required', 400);
  }

  // Check if car exists and is available
  const car = await Car.findById(carId);
  if (!car) {
    throw new AppError('Car not found', 404);
  }

  if (!car.isAvailable) {
    throw new AppError('Car is not available for purchase', 400);
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) {
    cart = new Cart({ user: req.userId, items: [] });
  }

  // Check if car already in cart
  const existingItem = cart.items.find(item => item.car.toString() === carId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ car: carId, quantity });
  }

  await cart.save();

  // Populate car details for response
  await cart.populate({
    path: 'items.car',
    select: 'brand model year price images isAvailable category',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  logger.info('Item added to cart', {
    userId: req.userId,
    carId,
    quantity
  });

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: cart
  });
});

// Update cart item quantity
export const updateCartItem = catchAsync(async (req, res) => {
  const { carId, quantity } = req.body;

  if (!carId || quantity === undefined) {
    throw new AppError('Car ID and quantity are required', 400);
  }

  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = await Cart.findOne({ user: req.userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const item = cart.items.find(item => item.car.toString() === carId);
  if (!item) {
    throw new AppError('Item not found in cart', 404);
  }

  item.quantity = quantity;
  await cart.save();

  await cart.populate({
    path: 'items.car',
    select: 'brand model year price images isAvailable category',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  logger.info('Cart item updated', {
    userId: req.userId,
    carId,
    quantity
  });

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: cart
  });
});

// Remove item from cart
export const removeFromCart = catchAsync(async (req, res) => {
  const { carId } = req.params;

  const cart = await Cart.findOne({ user: req.userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex(item => item.car.toString() === carId);
  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  await cart.populate({
    path: 'items.car',
    select: 'brand model year price images isAvailable category',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  logger.info('Item removed from cart', {
    userId: req.userId,
    carId
  });

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: cart
  });
});

// Clear cart
export const clearCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = [];
  await cart.save();

  logger.info('Cart cleared', {
    userId: req.userId
  });

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: cart
  });
});
