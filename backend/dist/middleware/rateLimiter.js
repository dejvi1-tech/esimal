"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRateLimiter = exports.apiRateLimiter = exports.orderRateLimiter = void 0;
class RateLimiter {
    constructor(config) {
        this.store = {};
        this.middleware = (req, res, next) => {
            this.cleanup();
            const key = this.getKey(req);
            const now = Date.now();
            if (!this.store[key]) {
                this.store[key] = {
                    count: 0,
                    resetTime: now + this.config.windowMs
                };
            }
            const record = this.store[key];
            if (now > record.resetTime) {
                record.count = 0;
                record.resetTime = now + this.config.windowMs;
            }
            record.count++;
            if (record.count > this.config.maxRequests) {
                res.status(429).json({
                    error: 'Too many requests',
                    message: this.config.message || 'Rate limit exceeded',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                });
                return;
            }
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': this.config.maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - record.count).toString(),
                'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
            });
            next();
        };
        this.config = config;
    }
    getKey(req) {
        // Use IP address as key, or user ID if authenticated
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.ip ||
            'unknown';
    }
    cleanup() {
        const now = Date.now();
        Object.keys(this.store).forEach(key => {
            if (this.store[key].resetTime <= now) {
                delete this.store[key];
            }
        });
    }
}
// Create rate limiters for different endpoints
exports.orderRateLimiter = new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10, // 10 orders per 10 minutes
    message: 'Too many order requests. Please try again later.'
}).middleware;
exports.apiRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 API calls per minute
    message: 'Too many API requests. Please try again later.'
}).middleware;
exports.emailRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 emails per minute
    message: 'Too many email requests. Please try again later.'
}).middleware;
//# sourceMappingURL=rateLimiter.js.map