import { AppError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

// Validation middleware factory
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                  source === 'params' ? req.params : req.body;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      
      logger.warn('Validation Error', {
        url: req.originalUrl,
        method: req.method,
        source,
        errors: error.details,
        data
      });
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace the original data with validated data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};
