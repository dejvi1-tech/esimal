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
import syncRoutes from './routes/syncRoutes';
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
import cookieParser from 'cookie-parser';
import scheduledJobRoutes from './routes/scheduledJobRoutes';
import csurf from 'csurf';

// Load environment variables
config();

// Create admin client for operations that need service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const app = express();

// Trust only 1 proxy (e.g. Render, Vercel) to safely support rate-limiting
app.set('trust proxy', 1); // ✅ FIXED from `true` to `1`

// Enhanced CORS configuration
const allowedOrigins = [
  'https://esimfly.al',
  'https://www.esimfly.al'
  
];
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'Referer',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-CSRF-Token',
    'X-Idempotency-Key',
    'Idempotency-Key',
    'Stripe-Version'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Add preflight handling for all routes
app.options('*', cors(corsOptions));

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: ["'self'", 'https://api.esimfly.al', 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // X-Content-Type-Options is set to nosniff by default by Helmet
}));

// Additional security headers (not covered by Helmet directly)
app.use((req, res, next) => {
  // Expect-CT: Enforce Certificate Transparency
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  // HSTS: Strict-Transport-Security (only if behind HTTPS)
  // 1 year, include subdomains, preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Permissions-Policy: restrict powerful features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Stripe webhook route FIRST, with raw body parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// THEN your other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser() as any);

// Register CSRF protection globally (after cookieParser, cors, helmet, before routes)
export const csrfProtection = csurf({ cookie: true });

// Enforce CSRF with strict Origin/Referer checks for /api/payments/create-intent
app.use((req: Request, res: Response, next: NextFunction) => {
  const isCreateIntent =
    req.method === 'POST' && req.path === '/api/payments/create-intent';

  if (isCreateIntent) {
    const origin = (req.headers.origin as string) || '';
    const referer = (req.headers.referer as string) || '';

    const allowedByOrigin = !!origin && allowedOrigins.includes(origin);
    const allowedByReferer =
      !!referer && allowedOrigins.some((o) => referer.startsWith(o));

    if (!(allowedByOrigin || allowedByReferer)) {
      logger.warn('Blocked /api/payments/create-intent due to invalid Origin/Referer', {
        origin,
        referer,
      });
      res.status(403).json({
        status: 'error',
        message: 'Forbidden: invalid origin',
      });
      return;
    }

    // Exempt CSRF for cross-origin JSON payment intent creation.
    // Reason: Frontend is on a different origin (https://esimfly.al) and modern
    // browsers (e.g., iOS Safari) block third‑party cookies, which csurf relies on.
    // Mitigation: strict Origin/Referer validation above + global rate limiting.
    return next();
  }

  // Enforce CSRF for all other state-changing routes
  csrfProtection(req, res, next);
});

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
app.use('/api/sync', syncRoutes);
app.use('/api/scheduled-jobs', scheduledJobRoutes);

// Direct routes to match frontend URLs
app.get('/api/get-section-packages', getSectionPackages);
app.get('/api/search-packages', searchPackages);
app.get('/api/packages/most-popular', getSectionPackages);

// Add email test endpoint
app.post('/api/test-email', (req: Request, res: Response, next: NextFunction): void => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    res.status(400).json({ 
      status: 'error', 
      message: 'Missing required fields: to, subject, message' 
    });
    return;
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
app.get('/api/frontend-packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, sale_price, reseller_id, slug, features, location_slug')
      .eq('visible', true)
      .eq('show_on_frontend', true)
      .order('data_amount', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    console.log(`[API] /api/frontend-packages returning ${data?.length || 0} admin-approved packages`);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
    return;
  }
});

// Add endpoint for featured packages (same as frontend packages for now)
app.get('/api/featured-packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.query;
    let query = supabaseAdmin
      .from('my_packages')
      .select('*')
      .eq('visible', true)
      .eq('show_on_frontend', true);
    
    // Only filter by country if country parameter is provided
    if (country && typeof country === 'string') {
      query = query.eq('country_code', country);
    }
    
    const { data, error } = await query.order('data_amount', { ascending: true });
    
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    console.log(`[API] /api/featured-packages returning ${data?.length || 0} admin-approved featured packages`);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured packages' });
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
function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Detailed CSRF error logging
  if (err.code === 'EBADCSRFTOKEN') {
    logger.error('CSRF token error', {
      url: req.originalUrl,
      method: req.method,
      cookies: req.cookies,
      headers: req.headers,
      body: req.body,
      message: err.message,
    });
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or missing CSRF token',
      details: err.message,
    });
  }
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

app.use(globalErrorHandler as import('express').ErrorRequestHandler);

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});

export default app;
