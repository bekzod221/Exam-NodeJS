import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

if (!process.env.JWT_ACCESS_SECRET) {
  process.env.JWT_ACCESS_SECRET = 'your-access-secret-key-change-in-production';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'your-refresh-secret-key-change-in-production';
}
if (!process.env.JWT_ACCESS_EXPIRES) {
  process.env.JWT_ACCESS_EXPIRES = '15m';
}
if (!process.env.JWT_REFRESH_EXPIRES) {
  process.env.JWT_REFRESH_EXPIRES = '7d';
}

import { globalErrorHandler, handleUncaughtException, handleUnhandledRejection } from './utils/errorHandler.js';
import { requestLogger } from './config/logger.js';
import logger from './config/logger.js';

import { mainRouter } from './routes/main.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { authRouter as enhancedAuthRouter } from './routes/enhanced-auth.routes.js';
import { carRouter } from './routes/enhanced-car.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { viewRouter } from './routes/view.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { orderRouter } from './routes/order.routes.js';

handleUncaughtException();
handleUnhandledRejection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("layout", "layout/layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use(requestLogger);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.admin = req.admin || null;
    next();
});  

app.use('/api/auth', authRouter);
app.use('/api/cars', carRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);

app.use('/', mainRouter);
app.use('/', viewRouter);

app.use('/api/auth-enhanced', enhancedAuthRouter);

app.use(globalErrorHandler);

app.use((req, res) => {
  logger.warn('404 Not Found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'API endpoint topilmadi'
    });
  } else {
    res.status(404).render('pages/404', {
      title: 'Sahifa topilmadi',
      message: 'Siz qidirayotgan sahifa mavjud emas'
    });
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/avto-salon')
  .then(() => {
    logger.info('MongoDB Connected', { host: mongoose.connection.host });
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message });
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, env: process.env.NODE_ENV });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
  });
});
