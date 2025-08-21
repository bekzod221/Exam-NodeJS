import logger from '../config/logger.js';

/**
 * Standard success response
 */
export const sendSuccess = (res, data = null, message = 'Muvaffaqiyatli', statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Standard error response
 */
export const sendError = (res, message = 'Server xatosi', statusCode = 500, error = null) => {
  if (error) {
    logger.error('API Error', {
      message,
      error: error.message,
      stack: error.stack
    });
  }
  
  return res.status(statusCode).json({
    success: false,
    message
  });
};

/**
 * Paginated response
 */
export const sendPaginatedResponse = (res, data, pagination, message = 'Ma\'lumotlar muvaffaqiyatli olindi') => {
  return res.json({
    success: true,
    message,
    data,
    pagination
  });
};

/**
 * Handle async controller errors
 */
export const handleControllerError = (res, error, customMessage = 'Server xatosi') => {
  logger.error('Controller Error', {
    message: customMessage,
    error: error.message,
    stack: error.stack
  });
  
  return sendError(res, customMessage, 500, error);
};
