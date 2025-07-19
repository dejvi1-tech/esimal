"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
// EDITED FULL EXPRESS APP WITH FIXED TRUST PROXY AND BEST PRACTICES
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const logger_1 = require("./utils/logger");
const packageRoutes_1 = __importDefault(require("./routes/packageRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const esimRoutes_1 = __importDefault(require("./routes/esimRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const stripeRoutes_1 = __importDefault(require("./routes/stripeRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes"));
const webhookController_1 = require("./controllers/webhookController");
const supabase_js_1 = require("@supabase/supabase-js");
const packageController_1 = require("./controllers/packageController");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const scheduledJobRoutes_1 = __importDefault(require("./routes/scheduledJobRoutes"));
const csurf_1 = __importDefault(require("csurf"));
// Load environment variables
(0, dotenv_1.config)();
// Create admin client for operations that need service role
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const app = (0, express_1.default)();
// Trust only 1 proxy (e.g. Render, Vercel) to safely support rate-limiting
app.set('trust proxy', 1); // ✅ FIXED from `true` to `1`
// Enhanced CORS configuration
const allowedOrigins = [
    'https://esimfly.al',
    'https://www.esimfly.al'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Add preflight handling for all routes
app.options('*', (0, cors_1.default)(corsOptions));
// Security
app.use((0, helmet_1.default)({
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
app.post('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), webhookController_1.handleStripeWebhook);
// THEN your other middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Register CSRF protection globally (after cookieParser, cors, helmet, before routes)
exports.csrfProtection = (0, csurf_1.default)({ cookie: true });
// TEMPORARY: Disable CSRF for /api/payments/create-intent for debugging
app.use((req, res, next) => {
    if (req.method === 'POST' &&
        req.path === '/api/payments/create-intent') {
        // Log that CSRF is skipped for this route
        logger_1.logger.warn('CSRF protection temporarily DISABLED for /api/payments/create-intent');
        return next();
    }
    return (0, exports.csrfProtection)(req, res, next);
});
// Rate limiting for public API
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Mount API routes
app.use('/api/packages', packageRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/esims', esimRoutes_1.default);
app.use('/api/account', accountRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/stripe', stripeRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/sync', syncRoutes_1.default);
app.use('/api/scheduled-jobs', scheduledJobRoutes_1.default);
// Direct routes to match frontend URLs
app.get('/api/get-section-packages', packageController_1.getSectionPackages);
app.get('/api/search-packages', packageController_1.searchPackages);
app.get('/api/packages/most-popular', packageController_1.getSectionPackages);
// Add email test endpoint
app.post('/api/test-email', (req, res, next) => {
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
        .catch((error) => {
        console.error('Email test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Email test failed: ' + (error.message || 'Unknown error')
        });
    });
});
// Add endpoint for frontend packages (plain array, only visible)
app.get('/api/frontend-packages', async (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch packages' });
        return;
    }
});
// Add endpoint for featured packages (same as frontend packages for now)
app.get('/api/featured-packages', async (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured packages' });
    }
});
// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});
// Global Error Handler
function globalErrorHandler(err, req, res, next) {
    // Detailed CSRF error logging
    if (err.code === 'EBADCSRFTOKEN') {
        logger_1.logger.error('CSRF token error', {
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
app.use(globalErrorHandler);
// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logger_1.logger.info(`Server started on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map