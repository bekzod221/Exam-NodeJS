import Car from '../models/Car.js';
import Category from '../models/Category.js';
import { catchAsync, AppError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Get all cars with filtering and pagination
export const getCars = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    brand,
    model,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    color,
    engine,
    gearbox,
    category,
    isAvailable
  } = req.query;

  // Build search query
  const searchQuery = {};
  
  if (brand) searchQuery.brand = new RegExp(brand, 'i');
  if (model) searchQuery.model = new RegExp(model, 'i');
  if (color) searchQuery.color = new RegExp(color, 'i');
  if (engine) searchQuery.engine = new RegExp(engine, 'i');
  if (gearbox) searchQuery.gearbox = gearbox;
  if (category) searchQuery.category = category;
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

  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [cars, total] = await Promise.all([
    Car.find(searchQuery)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Car.countDocuments(searchQuery)
  ]);

  logger.info('Cars fetched', {
    userId: req.userId,
    count: cars.length,
    filters: searchQuery
  });

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
});

// Get single car
export const getCar = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const car = await Car.findById(id)
    .populate('category', 'name description')
    .populate('createdBy', 'name email');

  if (!car) {
    throw new AppError('Mashina topilmadi', 404);
  }

  logger.info('Car fetched', {
    userId: req.userId,
    carId: id
  });

  res.json({
    success: true,
    data: car
  });
});

// Create car (Admin only)
export const createCar = catchAsync(async (req, res) => {
  const carData = {
    ...req.body,
    createdBy: req.userId
  };

  // Verify category exists
  const category = await Category.findById(carData.category);
  if (!category) {
    throw new AppError('Kategoriya topilmadi', 404);
  }

  // Process uploaded images
  let images = {
    exterior: '/assets/images/default-car.jpg',
    interior: '/assets/images/default-car.jpg',
    modelType: '/assets/images/default-car.jpg'
  };

  if (req.processedImages && Object.keys(req.processedImages).length > 0) {
    const imageKeys = Object.keys(req.processedImages);
    if (imageKeys.length > 0) images.exterior = req.processedImages[imageKeys[0]].original;
    if (imageKeys.length > 1) images.interior = req.processedImages[imageKeys[1]].original;
    if (imageKeys.length > 2) images.modelType = req.processedImages[imageKeys[2]].original;
  }

  carData.images = images;

  const car = await Car.create(carData);
  await car.populate([
    { path: 'category', select: 'name' },
    { path: 'createdBy', select: 'name' }
  ]);

  logger.info('Car created', {
    userId: req.userId,
    carId: car._id,
    brand: car.brand,
    model: car.model
  });

  res.status(201).json({
    success: true,
    message: 'Mashina muvaffaqiyatli yaratildi',
    data: car
  });
});

// Update car (Admin only or owner)
export const updateCar = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const car = await Car.findById(id);
  if (!car) {
    throw new AppError('Mashina topilmadi', 404);
  }

  // Check ownership (admin can edit any, user can edit only their own)
  if (req.user.role !== 'admin' && car.createdBy.toString() !== req.userId.toString()) {
    throw new AppError('Bu mashinani tahrirlash huquqingiz yo\'q', 403);
  }

  const updateData = { ...req.body };

  // Verify category if provided
  if (updateData.category) {
    const category = await Category.findById(updateData.category);
    if (!category) {
      throw new AppError('Kategoriya topilmadi', 404);
    }
  }

  // Process uploaded images if present
  if (req.processedImages && Object.keys(req.processedImages).length > 0) {
    const imageKeys = Object.keys(req.processedImages);
    updateData.images = { ...car.images };
    
    if (imageKeys.length > 0) updateData.images.exterior = req.processedImages[imageKeys[0]].original;
    if (imageKeys.length > 1) updateData.images.interior = req.processedImages[imageKeys[1]].original;
    if (imageKeys.length > 2) updateData.images.modelType = req.processedImages[imageKeys[2]].original;
  }

  const updatedCar = await Car.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'category', select: 'name' },
    { path: 'createdBy', select: 'name' }
  ]);

  logger.info('Car updated', {
    userId: req.userId,
    carId: id,
    changes: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Mashina muvaffaqiyatli yangilandi',
    data: updatedCar
  });
});

// Delete car (Admin only or owner)
export const deleteCar = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const car = await Car.findById(id);
  if (!car) {
    throw new AppError('Mashina topilmadi', 404);
  }

  // Check ownership (admin can delete any, user can delete only their own)
  if (req.user.role !== 'admin' && car.createdBy.toString() !== req.userId.toString()) {
    throw new AppError('Bu mashinani o\'chirish huquqingiz yo\'q', 403);
  }

  await Car.findByIdAndDelete(id);

  logger.info('Car deleted', {
    userId: req.userId,
    carId: id,
    brand: car.brand,
    model: car.model
  });

  res.json({
    success: true,
    message: 'Mashina muvaffaqiyatli o\'chirildi'
  });
});

// Bulk operations (Admin only)
export const bulkUpdateCars = catchAsync(async (req, res) => {
  const { carIds, updateData } = req.body;
  
  if (!Array.isArray(carIds) || carIds.length === 0) {
    throw new AppError('Mashina ID\'lari talab qilinadi', 400);
  }

  const result = await Car.updateMany(
    { _id: { $in: carIds } },
    updateData
  );

  logger.info('Bulk car update', {
    userId: req.userId,
    carIds,
    modifiedCount: result.modifiedCount
  });

  res.json({
    success: true,
    message: `${result.modifiedCount} ta mashina yangilandi`,
    modifiedCount: result.modifiedCount
  });
});

export const bulkDeleteCars = catchAsync(async (req, res) => {
  const { carIds } = req.body;
  
  if (!Array.isArray(carIds) || carIds.length === 0) {
    throw new AppError('Mashina ID\'lari talab qilinadi', 400);
  }

  const result = await Car.deleteMany({ _id: { $in: carIds } });

  logger.info('Bulk car delete', {
    userId: req.userId,
    carIds,
    deletedCount: result.deletedCount
  });

  res.json({
    success: true,
    message: `${result.deletedCount} ta mashina o'chirildi`,
    deletedCount: result.deletedCount
  });
});
