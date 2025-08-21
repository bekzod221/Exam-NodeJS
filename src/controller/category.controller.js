import Category from '../models/Category.js';
import Car from '../models/Car.js';
import { catchAsync, AppError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Get all categories
export const getCategories = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;
  
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const categories = await Category.find(query)
    .populate('createdBy', 'name email')
    .populate('carCount')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Category.countDocuments(query);

  logger.info('Categories fetched', {
    userId: req.userId,
    count: categories.length,
    page,
    limit
  });

  res.json({
    success: true,
    data: categories,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      count: total,
      limit: parseInt(limit)
    }
  });
});

// Get single category
export const getCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id)
    .populate('createdBy', 'name email')
    .populate('carCount');

  if (!category) {
    throw new AppError('Kategoriya topilmadi', 404);
  }

  logger.info('Category fetched', {
    userId: req.userId,
    categoryId: id
  });

  res.json({
    success: true,
    data: category
  });
});

// Create category (Admin only)
export const createCategory = catchAsync(async (req, res) => {
  const categoryData = {
    ...req.body,
    createdBy: req.userId
  };

  // Handle image upload if present
  if (req.processedImage) {
    categoryData.image = req.processedImage.original;
  }

  const category = await Category.create(categoryData);
  await category.populate('createdBy', 'name email');

  logger.info('Category created', {
    userId: req.userId,
    categoryId: category._id,
    categoryName: category.name
  });

  res.status(201).json({
    success: true,
    message: 'Kategoriya muvaffaqiyatli yaratildi',
    data: category
  });
});

// Update category (Admin only)
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Kategoriya topilmadi', 404);
  }

  const updateData = { ...req.body };
  
  // Handle image upload if present
  if (req.processedImage) {
    updateData.image = req.processedImage.original;
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  logger.info('Category updated', {
    userId: req.userId,
    categoryId: id,
    changes: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Kategoriya muvaffaqiyatli yangilandi',
    data: updatedCategory
  });
});

// Delete category (Admin only)
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Kategoriya topilmadi', 404);
  }

  // Check if category has cars
  const carCount = await Car.countDocuments({ category: id });
  if (carCount > 0) {
    throw new AppError('Bu kategoriyada mashinalar mavjud. Avval mashinalarni boshqa kategoriyaga o\'tkazing yoki o\'chiring', 400);
  }

  await Category.findByIdAndDelete(id);

  logger.info('Category deleted', {
    userId: req.userId,
    categoryId: id,
    categoryName: category.name
  });

  res.json({
    success: true,
    message: 'Kategoriya muvaffaqiyatli o\'chirildi'
  });
});

// Get cars by category
export const getCarsByCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  // Check if category exists
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Kategoriya topilmadi', 404);
  }

  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  
  const cars = await Car.find({ category: id, isAvailable: true })
    .populate('category', 'name')
    .populate('createdBy', 'name')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Car.countDocuments({ category: id, isAvailable: true });

  logger.info('Cars by category fetched', {
    userId: req.userId,
    categoryId: id,
    count: cars.length
  });

  res.json({
    success: true,
    data: {
      category: {
        _id: category._id,
        name: category.name,
        description: category.description
      },
      cars
    },
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      count: total,
      limit: parseInt(limit)
    }
  });
});
