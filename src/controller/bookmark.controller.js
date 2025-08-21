import Bookmark from '../models/Bookmark.js';
import Car from '../models/Car.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

// Toggle bookmark (add/remove)
export const toggleBookmark = catchAsync(async (req, res) => {
  const { carId } = req.body;
  const userId = req.user._id;

  if (!carId) {
    return sendError(res, 'Car ID is required', 400);
  }

  // Check if car exists
  const car = await Car.findById(carId);
  if (!car) {
    return sendError(res, 'Car not found', 404);
  }

  // Check if bookmark already exists
  const existingBookmark = await Bookmark.findOne({ userId, carId });

  if (existingBookmark) {
    // Remove bookmark
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    
    return sendSuccess(res, {
      isBookmarked: false,
      message: 'Removed from favorites'
    });
  } else {
    // Add bookmark
    const newBookmark = new Bookmark({
      userId,
      carId
    });
    
    await newBookmark.save();
    
    return sendSuccess(res, {
      isBookmarked: true,
      message: 'Added to favorites'
    });
  }
});

// Get user's bookmarks
export const getUserBookmarks = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const bookmarks = await Bookmark.find({ userId })
    .populate({
      path: 'carId',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

  const bookmarkedCars = bookmarks
    .map(bookmark => bookmark.carId)
    .filter(Boolean);

  return sendSuccess(res, {
    bookmarks: bookmarkedCars,
    count: bookmarkedCars.length
  });
});

// Check if car is bookmarked by user
export const checkBookmarkStatus = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const userId = req.user._id;

  if (!carId) {
    return sendError(res, 'Car ID is required', 400);
  }

  const bookmark = await Bookmark.findOne({ userId, carId });
  
  return sendSuccess(res, {
    isBookmarked: !!bookmark
  });
});

// Remove bookmark
export const removeBookmark = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const userId = req.user._id;

  if (!carId) {
    return sendError(res, 'Car ID is required', 400);
  }

  const bookmark = await Bookmark.findOneAndDelete({ userId, carId });
  
  if (!bookmark) {
    return sendError(res, 'Bookmark not found', 404);
  }

  return sendSuccess(res, {
    message: 'Removed from favorites'
  });
});
