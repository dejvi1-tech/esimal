"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const webhookController_1 = require("./controllers/webhookController");
const ipWhitelist_1 = require("./middleware/ipWhitelist");
const supabase_1 = require("./config/supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const RoamifyService_1 = require("./services/RoamifyService");
const analytics_1 = require("./utils/analytics");
// Load environment variables
(0, dotenv_1.config)();
// Create Express app
const app = (0, express_1.default)();
// Enable CORS for frontend
app.use((0, cors_1.default)({
    origin: 'http://localhost:8080',
    credentials: true
}));
// Security middleware
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
// Special handling for Stripe webhooks - raw body needed for signature verification
app.use('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Comprehensive health check including Roamify API
app.get('/health/full', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: 'unknown',
                roamify: 'unknown',
                email: 'unknown',
                stripe: 'unknown'
            }
        };
        // Check database connection
        try {
            const { data, error } = await supabase_1.supabase.from('my_packages').select('count').limit(1);
            healthStatus.services.database = error ? 'unhealthy' : 'healthy';
        }
        catch (error) {
            healthStatus.services.database = 'unhealthy';
        }
        // Check Roamify API
        try {
            const roamifyHealthy = await RoamifyService_1.RoamifyService.checkApiHealth();
            healthStatus.services.roamify = roamifyHealthy ? 'healthy' : 'unhealthy';
        }
        catch (error) {
            healthStatus.services.roamify = 'unhealthy';
        }
        // Check email service
        try {
            // Simple check - just verify SMTP config exists
            const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
            healthStatus.services.email = smtpConfigured ? 'healthy' : 'unhealthy';
        }
        catch (error) {
            healthStatus.services.email = 'unhealthy';
        }
        // Check Stripe configuration
        try {
            const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
            healthStatus.services.stripe = stripeConfigured ? 'healthy' : 'unhealthy';
        }
        catch (error) {
            healthStatus.services.stripe = 'unhealthy';
        }
        // Overall status
        const allHealthy = Object.values(healthStatus.services).every(service => service === 'healthy');
        healthStatus.status = allHealthy ? 'healthy' : 'degraded';
        const statusCode = allHealthy ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// Create a Supabase client with service role key to bypass RLS for admin endpoints
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// API routes - Admin routes (protected by IP whitelist)
app.use('/api/admin', ipWhitelist_1.ipWhitelist, adminRoutes_1.default);
app.use('/api/admin/packages', ipWhitelist_1.ipWhitelist, packageRoutes_1.default);
app.use('/api/admin/orders', ipWhitelist_1.ipWhitelist, orderRoutes_1.default);
app.use('/api/admin/esim', ipWhitelist_1.ipWhitelist, esimRoutes_1.default);
app.use('/api/admin/account', ipWhitelist_1.ipWhitelist, accountRoutes_1.default);
// Public routes
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/stripe', stripeRoutes_1.default);
// Stripe webhook endpoint (no rate limiting, raw body needed)
app.post('/api/webhooks/stripe', webhookController_1.handleStripeWebhook);
// Get Packages for Frontend (Only Visible)
app.get('/api/frontend-packages', (async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('my_packages')
            .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id')
            .eq('visible', true)
            .order('sale_price', { ascending: true });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
}));
// Get All Roamify Packages for Admin Panel (with pagination to get all packages)
app.get('/api/admin/all-roamify-packages', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        console.log('Fetching all Roamify packages with pagination...');
        let allPackages = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        // Fetch all packages using pagination
        while (hasMore) {
            const { data, error } = await supabaseAdmin
                .from('packages')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);
            if (error) {
                console.error('Error fetching packages:', error);
                return res.status(500).json({ error: error.message });
            }
            if (data && data.length > 0) {
                allPackages = allPackages.concat(data);
                page++;
                console.log(`Fetched page ${page}, total packages so far: ${allPackages.length}`);
            }
            else {
                hasMore = false;
            }
        }
        console.log(`Total packages fetched before deduplication: ${allPackages.length}`);
        // Deduplicate packages
        const uniquePackages = new Map();
        // First pass: Group by ID
        allPackages.forEach(pkg => {
            const id = pkg.reseller_id || pkg.id;
            if (id && (!uniquePackages.has(id) || pkg.updated_at > uniquePackages.get(id).updated_at)) {
                uniquePackages.set(id, pkg);
            }
        });
        // Second pass: Group by combination
        const combinationPackages = new Map();
        Array.from(uniquePackages.values()).forEach(pkg => {
            const key = `${pkg.country_name}|${pkg.data_amount}|${pkg.validity_days}|${pkg.price}`;
            if (!combinationPackages.has(key) || pkg.updated_at > combinationPackages.get(key).updated_at) {
                combinationPackages.set(key, pkg);
            }
        });
        // Get final deduplicated packages
        const dedupedPackages = Array.from(combinationPackages.values());
        console.log(`Total packages after deduplication: ${dedupedPackages.length}`);
        // Transform data for frontend compatibility
        const transformedData = dedupedPackages.map(pkg => ({
            id: pkg.id,
            packageId: pkg.reseller_id, // Frontend expects packageId
            name: pkg.name,
            package: pkg.name, // Frontend expects package field
            country: pkg.country_name, // Frontend expects country instead of country_name
            country_code: pkg.country_code,
            data_amount: pkg.data_amount,
            validity_days: pkg.validity_days,
            day: pkg.validity_days, // Frontend expects day field
            base_price: pkg.price, // Roamify price (base price)
            sale_price: pkg.price, // Default to base price, admin can edit
            price: pkg.price, // Frontend expects price field
            operator: pkg.operator,
            type: pkg.type,
            is_active: pkg.is_active,
            created_at: pkg.created_at,
            updated_at: pkg.updated_at
        }));
        res.json(transformedData);
    }
    catch (error) {
        console.error('Error in all-roamify-packages endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch Roamify packages' });
    }
}));
// Get My Packages for Admin Panel
app.get('/api/admin/my-packages', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        // Fetch all packages from the my_packages table using service role to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch my packages' });
    }
}));
// Save Package to My Packages (Admin only)
app.post('/api/admin/save-package', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        const packageData = req.body;
        // Validate required fields
        if (!packageData.name || !packageData.country_name || !packageData.data_amount ||
            !packageData.validity_days || !packageData.base_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Convert data_amount from GB to MB for storage
        const dataAmountInMB = Math.round(packageData.data_amount * 1024);
        // Generate a unique ID
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const uniqueId = `esim-${packageData.country_name.toLowerCase().replace(/\s+/g, '-')}-${packageData.validity_days}days-${dataAmountInMB}mb-${timestamp}-${randomId}`;
        // Insert into my_packages table using service role to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('my_packages')
            .insert([{
                id: uniqueId,
                name: packageData.name,
                country_name: packageData.country_name,
                country_code: packageData.country_code || '',
                data_amount: dataAmountInMB, // Store in MB
                validity_days: packageData.validity_days,
                base_price: packageData.base_price,
                sale_price: packageData.sale_price || packageData.base_price,
                profit: packageData.profit || 0,
                reseller_id: packageData.reseller_id || uniqueId,
                region: packageData.region || '',
                visible: true
            }])
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save package' });
    }
}));
// Save Package with Most Popular Settings (Admin only)
app.post('/api/save-package', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        const packageData = req.body;
        // Validate required fields
        if (!packageData.id || !packageData.country || !packageData.data ||
            !packageData.days || !packageData.base_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Convert data from string to MB for storage
        let dataAmountInMB = 0;
        if (typeof packageData.data === 'string') {
            const match = packageData.data.match(/(\d+(?:\.\d+)?)(GB|MB|KB)?/i);
            if (match) {
                let value = parseFloat(match[1]);
                const unit = match[2]?.toUpperCase() || 'GB';
                if (unit === 'GB')
                    value = value * 1024;
                if (unit === 'KB')
                    value = value / 1024;
                dataAmountInMB = Math.round(value);
            }
        }
        else if (typeof packageData.data === 'number') {
            dataAmountInMB = Math.round(packageData.data * 1024); // Assume GB
        }
        // Upsert into my_packages table using service role to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('my_packages')
            .upsert([{
                id: packageData.id,
                name: packageData.country + ' eSIM Package',
                country_name: packageData.country,
                country_code: packageData.country_code || '',
                data_amount: dataAmountInMB,
                validity_days: packageData.days,
                base_price: packageData.base_price,
                sale_price: packageData.sale_price || packageData.base_price,
                profit: packageData.profit || 0,
                reseller_id: packageData.id,
                region: packageData.country,
                visible: true,
                location_slug: packageData.location_slug || null,
                show_on_frontend: packageData.show_on_frontend || false,
                homepage_order: packageData.homepage_order || 0
            }], { onConflict: 'id' })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save package' });
    }
}));
// Update Package in My Packages (Admin only)
app.put('/api/admin/update-package/:id', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        const { id } = req.params;
        const packageData = req.body;
        // Validate required fields
        if (!packageData.name || !packageData.country_name || !packageData.data_amount ||
            !packageData.validity_days || !packageData.base_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Convert data_amount from GB to MB for storage
        const dataAmountInMB = Math.round(packageData.data_amount * 1024);
        // Update in my_packages table using service role to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('my_packages')
            .update({
            name: packageData.name,
            country_name: packageData.country_name,
            country_code: packageData.country_code || '',
            data_amount: dataAmountInMB, // Store in MB
            validity_days: packageData.validity_days,
            base_price: packageData.base_price,
            sale_price: packageData.sale_price || packageData.base_price,
            profit: packageData.profit || 0,
            reseller_id: packageData.reseller_id || id,
            region: packageData.region || '',
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update package' });
    }
}));
// Delete Package from My Packages (Admin only)
app.delete('/api/admin/delete-package/:id', ipWhitelist_1.ipWhitelist, (async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('my_packages')
            .delete()
            .eq('id', id);
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete package' });
    }
}));
// Get Featured Packages for Homepage (Europe region, one per country)
app.get('/api/featured-packages', (async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('my_packages')
            .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id, region')
            .eq('visible', true)
            .eq('region', 'Europe')
            .order('sale_price', { ascending: true });
        if (error)
            return res.status(500).json({ error: error.message });
        // Group by country and select the cheapest package per country
        const packagesByCountry = new Map();
        data?.forEach(pkg => {
            if (!packagesByCountry.has(pkg.country_name) ||
                pkg.sale_price < packagesByCountry.get(pkg.country_name).sale_price) {
                packagesByCountry.set(pkg.country_name, pkg);
            }
        });
        const featuredPackages = Array.from(packagesByCountry.values());
        res.json(featuredPackages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured packages' });
    }
}));
// Search Packages by Country
app.get('/api/search-packages', (async (req, res) => {
    try {
        const { country } = req.query;
        if (!country || typeof country !== 'string') {
            return res.status(400).json({ error: 'Country parameter is required' });
        }
        // Mapping for bundle IDs to actual country names in database
        const countryMapping = {
            'dubai': ['Emiratet e Bashkuara Arabe', 'United Arab Emirates', 'UAE', 'Dubai'],
            'DUBAI': ['Emiratet e Bashkuara Arabe', 'United Arab Emirates', 'UAE', 'Dubai'],
            'uk': ['United Kingdom', 'UK', 'Great Britain'],
            'new-york': ['United States', 'USA', 'US', 'New York'],
            'illyria': ['Illyria', 'Balkan'],
            // Add more mappings as needed
        };
        let searchTerms = [country];
        // If we have a mapping for this country, use the mapped terms
        if (countryMapping[country.toLowerCase()]) {
            searchTerms = countryMapping[country.toLowerCase()];
        }
        let query = supabase_1.supabase
            .from('my_packages')
            .select('id, name, country_name, country_code, data_amount, validity_days, sale_price, reseller_id, region')
            .eq('visible', true);
        // Build the OR query with all search terms
        const orConditions = [];
        searchTerms.forEach(term => {
            // If the search term looks like a country code (2-3 letters), match country_code exactly only
            if (term.length <= 3 && /^[A-Za-z]+$/.test(term)) {
                orConditions.push(`country_code.eq.${term.toUpperCase()}`);
                // Do NOT match region or country_name for short codes
            }
            else {
                // For longer search terms (region/country name), match region exactly and country_name partially
                orConditions.push(`region.eq.${term}`);
                orConditions.push(`country_name.ilike.${term}%`);
            }
        });
        query = query.or(orConditions.join(','));
        const { data, error } = await query.order('sale_price', { ascending: true });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to search packages' });
    }
}));
// Get Section Packages (Frontend)
app.get('/api/get-section-packages', (async (req, res) => {
    try {
        const { slug } = req.query;
        if (!slug) {
            return res.status(400).json({ error: 'Slug parameter is required' });
        }
        const { data, error } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('location_slug', slug)
            .eq('show_on_frontend', true)
            .order('homepage_order', { ascending: true });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch section packages' });
    }
}));
// Analytics endpoint (admin only)
app.get('/api/analytics', ipWhitelist_1.ipWhitelist, async (req, res) => {
    try {
        const analytics = await analytics_1.AnalyticsService.getAnalytics();
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});
// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        status: err.status || 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logger_1.logger.info(`Server started on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map