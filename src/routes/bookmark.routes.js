import { Router } from 'express';
import { 
  toggleBookmark, 
  getUserBookmarks, 
  checkBookmarkStatus, 
  removeBookmark 
} from '../controller/bookmark.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const bookmarkRouter = Router();

// All bookmark routes require authentication
bookmarkRouter.use(requireAuth);

// Toggle bookmark (add/remove)
bookmarkRouter.post('/toggle', toggleBookmark);

// Get user's bookmarks
bookmarkRouter.get('/', getUserBookmarks);

// Check if car is bookmarked
bookmarkRouter.get('/check/:carId', checkBookmarkStatus);

// Remove bookmark
bookmarkRouter.delete('/:carId', removeBookmark);

export { bookmarkRouter };
