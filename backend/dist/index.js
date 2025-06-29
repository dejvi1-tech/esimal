"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const webhookController_1 = require("./controllers/webhookController");
const supabase_1 = require("./config/supabase");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOptions));
// Add preflight handling for all routes
app.options('*', (0, cors_1.default)(corsOptions));
// Security
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Parse JSON (except Stripe raw body)
app.use(express_1.default.json());
// Raw body parser for Stripe webhook
app.post('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), webhookController_1.handleStripeWebhook);
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
// Direct routes to match frontend URLs
app.get('/api/get-section-packages', (req, res, next) => {
    const controller = require('./controllers/packageController');
    return controller.getSectionPackages(req, res, next);
});
app.get('/api/search-packages', (req, res, next) => {
    const controller = require('./controllers/packageController');
    return controller.searchPackages(req, res, next);
});
// Add most-popular endpoint to match frontend expectation
app.get('/api/packages/most-popular', (req, res, next) => {
    const controller = require('./controllers/packageController');
    return controller.getSectionPackages(req, res, next);
});
// Add endpoint for frontend packages (plain array, only visible)
app.get('/api/frontend-packages', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('my_packages')
            .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id')
            .eq('visible', true)
            .order('sale_price', { ascending: true });
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch packages' });
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
app.use((err, req, res, next) => {
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
    logger_1.logger.info(`Server started on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map