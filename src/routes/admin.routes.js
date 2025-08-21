import { Router } from "express";
import { requireAdminAuth } from "../middleware/admin.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import { getAnalytics } from "../controller/analytics.controller.js";
import { sendSuccess, sendError, handleControllerError } from "../utils/responseUtils.js";
import { buildQuery, buildSort, calculateSkip } from "../utils/dbUtils.js";
import { getPaginationMeta } from "../utils/validationUtils.js";
import User from "../models/User.js";
import Car from "../models/Car.js";
import Order from "../models/Order.js";
import { sendOrderConfirmation } from "../config/email.js";

const adminRouter = Router();

// Apply admin auth middleware to all routes
adminRouter.use(requireAdminAuth);

// Get user statistics
adminRouter.get("/stats/users", async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'user' });
    sendSuccess(res, { count });
  } catch (error) {
    handleControllerError(res, error, 'Foydalanuvchi statistikasini olishda xatolik');
  }
});

// Get order statistics
adminRouter.get("/stats/orders", async (req, res) => {
  try {
    const count = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    
    sendSuccess(res, { 
      count, 
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0 
    });
  } catch (error) {
    handleControllerError(res, error, 'Buyurtma statistikasini olishda xatolik');
  }
});

// Get all users
adminRouter.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -verificationCode')
      .sort({ createdAt: -1 });
    
    sendSuccess(res, users);
  } catch (error) {
    handleControllerError(res, error, 'Foydalanuvchilarni olishda xatolik');
  }
});

// Get all admins
adminRouter.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password -verificationCode')
      .sort({ createdAt: -1 });
    
    res.json(admins);
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get all orders
adminRouter.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('carId', 'brand model price')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Add new car with image upload
adminRouter.post("/cars", uploadMultiple('images', 5), async (req, res) => {
  try {
    const carData = req.body;
    
    // Process uploaded images
    let images = {
      exterior: '/assets/images/chevrolet.jpg',
      interior: '/assets/images/chevrolet.jpg',
      modelType: '/assets/images/chevrolet.jpg'
    };

    if (req.processedImages && Object.keys(req.processedImages).length > 0) {
      const imageKeys = Object.keys(req.processedImages);
      if (imageKeys.length > 0) images.exterior = req.processedImages[imageKeys[0]].original;
      if (imageKeys.length > 1) images.interior = req.processedImages[imageKeys[1]].original;
      if (imageKeys.length > 2) images.modelType = req.processedImages[imageKeys[2]].original;
    }
    
    // Create new car
    const car = new Car({
      ...carData,
      price: parseInt(carData.price),
      year: parseInt(carData.year),
      distance: parseInt(carData.distance),
      images
    });
    
    await car.save();
    
    res.status(201).json({
      success: true,
      message: 'Mashina muvaffaqiyatli qo\'shildi',
      car
    });
    
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update car
adminRouter.put("/cars/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const car = await Car.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }
    
    res.json({
      success: true,
      message: 'Mashina muvaffaqiyatli yangilandi',
      car
    });
    
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Delete car
adminRouter.delete("/cars/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findByIdAndDelete(id);
    
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }
    
    res.json({
      success: true,
      message: 'Mashina muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Get analytics data
adminRouter.get("/analytics", getAnalytics);

// Advanced search and filtering
adminRouter.get("/cars/search", async (req, res) => {
  try {
    const { 
      brand, 
      model, 
      minPrice, 
      maxPrice, 
      minYear, 
      maxYear, 
      color, 
      engine, 
      gearbox,
      isAvailable,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    const searchQuery = {};
    
    if (brand) searchQuery.brand = new RegExp(brand, 'i');
    if (model) searchQuery.model = new RegExp(model, 'i');
    if (color) searchQuery.color = new RegExp(color, 'i');
    if (engine) searchQuery.engine = new RegExp(engine, 'i');
    if (gearbox) searchQuery.gearbox = new RegExp(gearbox, 'i');
    if (isAvailable !== undefined) searchQuery.isAvailable = isAvailable === 'true';
    
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseInt(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseInt(maxPrice);
    }
    
    if (minYear || maxYear) {
      searchQuery.year = {};
      if (minYear) searchQuery.year.$gte = parseInt(minYear);
      if (maxYear) searchQuery.year.$lte = parseInt(maxYear);
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [cars, total] = await Promise.all([
      Car.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Car.countDocuments(searchQuery)
    ]);
    
    res.json({
      success: true,
      data: cars,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching cars:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Update order status and send notifications
adminRouter.put("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'name email').populate('carId', 'brand model price');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }
    
    // Send email notification for status updates
    if (status === 'confirmed' || status === 'completed') {
      await sendOrderConfirmation(order.userId.email, {
        car: `${order.carId.brand} ${order.carId.model}`,
        price: order.totalPrice.toLocaleString() + ' so\'m',
        orderId: order._id,
        status: status
      });
    }
    
    res.json({
      success: true,
      message: 'Buyurtma holati yangilandi',
      order
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// Bulk operations
adminRouter.post("/cars/bulk-update", async (req, res) => {
  try {
    const { carIds, updateData } = req.body;
    
    const result = await Car.updateMany(
      { _id: { $in: carIds } },
      updateData
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} ta mashina yangilandi`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Error bulk updating cars:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

adminRouter.delete("/cars/bulk-delete", async (req, res) => {
  try {
    const { carIds } = req.body;
    
    const result = await Car.deleteMany({ _id: { $in: carIds } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} ta mashina o'chirildi`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error bulk deleting cars:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export { adminRouter }; 