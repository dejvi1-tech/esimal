"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
exports.adminLoginHandler = adminLoginHandler;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ADMIN_USERNAME = 'egde';
const ADMIN_PASSWORD = 'Elbasan2016!'; // Change this to a strong password
const JWT_SECRET = 'z1ZqAp7aybxGbkEu33Ipz2dwDyGlqbJY9slb08mZd4s/qNRLicLkMpIC3k0ynf//TeFqjvsGzoDLrYI3Fqj7tA=='; // Change this to a strong secret
// Middleware to protect admin routes
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (payload.username !== ADMIN_USERNAME) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Optionally attach user info to req
        req.admin = true;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
}
// Route handler for login
function adminLoginHandler(req, res, next) {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jsonwebtoken_1.default.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
        return;
    }
    res.status(401).json({ error: 'Invalid credentials' });
    return;
}
//# sourceMappingURL=auth.js.map