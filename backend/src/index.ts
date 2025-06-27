// EDITED FULL EXPRESS APP WITH FIXED TRUST PROXY AND BEST PRACTICES
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import packageRoutes from './routes/packageRoutes';
import orderRoutes from './routes/orderRoutes';
import esimRoutes from './routes/esimRoutes';
import accountRoutes from './routes/accountRoutes';
import adminRoutes from './routes/adminRoutes';
import stripeRoutes from './routes/stripeRoutes';
import { handleStripeWebhook } from './controllers/webhookController';
import { ipWhitelist } from './middleware/ipWhitelist';
import { BaseError } from './utils/errors';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import axios from 'axios';
import { supabase } from './config/supabase';
import { createClient } from '@supabase/supabase-js';
import { RoamifyService } from './services/roamifyService';
import { AnalyticsService } from './utils/analytics';
import { asyncHandler } from './utils/asyncHandler';

// Load environment variables
config();

const app = express();

// Trust only 1 proxy (e.g. Render, Vercel) to safely support rate-limiting
app.set('trust proxy', 1); // ✅ FIXED from `true` to `1`

// Enable CORS
app.use(cors({
  origin: ['https://esimfly.al', 'http://localhost:8080'],
  credentials: true
}));

// Security
app.use(helmet());

// Parse JSON (except Stripe raw body)
app.use(express.json());

// Raw body parser for Stripe webhook
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Rate limiting for public API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount API routes
app.use('/api/packages', packageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/esims', esimRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);

// Direct routes to match frontend URLs
app.get('/api/get-section-packages', (req, res, next) => {
  const controller = require('./controllers/packageController');
  return controller.getSectionPackages(req, res, next);
});

app.get('/api/search-packages', (req, res, next) => {
  const controller = require('./controllers/packageController');
  return controller.searchPackages(req, res, next);
});

// 404 Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});

export default app;
