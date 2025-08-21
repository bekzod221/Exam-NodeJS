import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Car from '../models/Car.js';
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { sendOrderConfirmation } from '../config/email.js';
import logger from '../config/logger.js';

// Create order (checkout)
export const createOrder = catchAsync(async (req, res) => {
  const {
    shippingAddress,
    contactInfo,
    paymentMethod,
    notes
  } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.userId })
    .populate({
      path: 'items.car',
      select: 'brand model year price images isAvailable category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Validate cart items are still available
  for (const item of cart.items) {
    if (!item.car.isAvailable) {
      throw new AppError(`Car ${item.car.brand} ${item.car.model} is no longer available`, 400);
    }
  }

  // Calculate total amount
  const totalAmount = cart.items.reduce((total, item) => {
    return total + (item.car.price * item.quantity);
  }, 0);

  // Create order items
  const orderItems = cart.items.map(item => ({
    car: item.car._id,
    quantity: item.quantity,
    price: item.car.price
  }));

  // Create order
  const order = new Order({
    user: req.userId,
    items: orderItems,
    totalAmount,
    shippingAddress,
    contactInfo,
    paymentMethod,
    notes
  });

  await order.save();

  // Clear cart after successful order
  cart.items = [];
  await cart.save();

  // Mark cars as unavailable
  for (const item of cart.items) {
    await Car.findByIdAndUpdate(item.car._id, { isAvailable: false });
  }

  // Send confirmation email
  try {
    await sendOrderConfirmation(contactInfo.email, {
      orderId: order.orderNumber,
      totalAmount: order.totalAmount,
      items: cart.items.map(item => ({
        car: `${item.car.brand} ${item.car.model} ${item.car.year}`,
        price: item.car.price,
        quantity: item.quantity
      }))
    });
  } catch (error) {
    logger.error('Failed to send order confirmation email', {
      orderId: order._id,
      error: error.message
    });
  }

  // Populate order details for response
  await order.populate({
    path: 'items.car',
    select: 'brand model year price images category',
    populate: {
      path: 'category',
      select: 'name'
    }
  });

  logger.info('Order created', {
    userId: req.userId,
    orderId: order._id,
    totalAmount
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// Get user's orders
export const getUserOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { user: req.userId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate({
      path: 'items.car',
      select: 'brand model year price images category',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// Get single order
export const getOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, user: req.userId })
    .populate({
      path: 'items.car',
      select: 'brand model year price images category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: order
  });
});

// Cancel order
export const cancelOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, user: req.userId });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status !== 'pending') {
    throw new AppError('Order cannot be cancelled', 400);
  }

  order.status = 'cancelled';
  await order.save();

  // Mark cars as available again
  for (const item of order.items) {
    await Car.findByIdAndUpdate(item.car, { isAvailable: true });
  }

  logger.info('Order cancelled', {
    userId: req.userId,
    orderId: order._id
  });

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// Admin: Update order status
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  order.status = status;
  await order.save();

  logger.info('Order status updated', {
    orderId: order._id,
    status,
    updatedBy: req.userId
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

// Admin: Get all orders
export const getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, paymentStatus } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate({
      path: 'items.car',
      select: 'brand model year price images category',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});
