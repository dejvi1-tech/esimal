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
import paymentRoutes from './routes/paymentRoutes';
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
import { getSectionPackages, searchPackages } from './controllers/packageController';

// Load environment variables
config();

const app = express();

// Trust only 1 proxy (e.g. Render, Vercel) to safely support rate-limiting
app.set('trust proxy', 1); // ✅ FIXED from `true` to `1`

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://esimfly.al',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Add preflight handling for all routes
app.options('*', cors(corsOptions));

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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
app.use('/api/payments', paymentRoutes);

// Direct routes to match frontend URLs
app.get('/api/get-section-packages', getSectionPackages);
app.get('/api/search-packages', searchPackages);
app.get('/api/packages/most-popular', getSectionPackages);

// Add email test endpoint
app.post('/api/test-email', (req: Request, res: Response) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing required fields: to, subject, message' 
    });
  }
  const { sendEmail } = require('./services/emailService');
  sendEmail({
    to,
    subject,
    html: `
      <h2>Test Email</h2>
      <p>${message}</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>SMTP Host: ${process.env.SMTP_HOST || 'Not set'}</p>
      <p>SMTP User: ${process.env.SMTP_USER || 'Not set'}</p>
    `
  })
    .then(() => {
      res.json({ 
        status: 'success', 
        message: 'Test email sent successfully' 
      });
    })
    .catch((error: any) => {
      console.error('Email test failed:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Email test failed: ' + (error.message || 'Unknown error') 
      });
    });
});

// Add endpoint for frontend packages (plain array, only visible)
app.get('/api/frontend-packages', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id')
      .eq('visible', true)
      .order('sale_price', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
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
