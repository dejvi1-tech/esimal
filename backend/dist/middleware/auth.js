"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
exports.adminLoginHandler = adminLoginHandler;
exports.adminLogoutHandler = adminLogoutHandler;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET must be set in environment variables');
}
// Type assertion for JWT_SECRET
const JWT_SECRET_STR = JWT_SECRET;
/**
 * Middleware to protect admin routes using cookie-based JWT authentication.
 *
 * Checks for JWT in req.cookies.auth_token. If not present, falls back to Authorization header.
 * Attaches admin info to req if valid, else returns 401 Unauthorized.
 *
 * Args:
 *   req (Request): Express request object.
 *   res (Response): Express response object.
 *   next (NextFunction): Express next middleware function.
 *
 * Returns:
 *   void
 */
function requireAdminAuth(req, res, next) {
    // 1. Try cookie-based auth first
    let token = req.cookies?.auth_token;
    // 2. Fallback to Authorization header if no cookie
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No auth token provided' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET_STR);
        if (payload.username !== ADMIN_USERNAME) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Attach admin info to req
        req.admin = true;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        }
        else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        }
        else {
            res.status(401).json({ error: 'Invalid or expired token' });
        }
        return;
    }
}
/**
 * Route handler for admin login. Validates input with zod, checks credentials, and issues JWT cookie.
 *
 * Args:
 *   req (Request): Express request object.
 *   res (Response): Express response object.
 *   next (NextFunction): Express next middleware function.
 *
 * Returns:
 *   void
 */
function adminLoginHandler(req, res, next) {
    const loginSchema = zod_1.z.object({
        username: zod_1.z.string().min(1, 'Username is required'),
        password: zod_1.z.string().min(1, 'Password is required'),
    });
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
        if (process.env.NODE_ENV === 'development') {
            console.log('❌ Zod validation failed:', parseResult.error.errors);
        }
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: parseResult.error.errors
        });
        return;
    }
    const { username, password } = parseResult.data;
    if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Admin login attempt');
        console.log('📝 Received username:', username);
        console.log('📝 Received password: [REDACTED]');
        console.log('🔑 Expected username:', ADMIN_USERNAME);
        console.log('🔑 Expected password: [REDACTED]');
    }
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Login successful');
        }
        const token = jsonwebtoken_1.default.sign({ username }, JWT_SECRET_STR, { expiresIn: '8h' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
        res.json({
            success: true,
            token,
            message: 'Login successful'
        });
        return;
    }
    if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid credentials');
    }
    res.status(401).json({
        success: false,
        error: 'Invalid username or password'
    });
    return;
}
// Route handler for logout (optional - for server-side session management)
function adminLogoutHandler(req, res, next) {
    // Since we're using JWT tokens stored in localStorage, 
    // the actual logout happens on the client side
    // This endpoint can be used for any server-side cleanup if needed
    res.json({
        success: true,
        message: 'Logout successful'
    });
}
//# sourceMappingURL=auth.js.map