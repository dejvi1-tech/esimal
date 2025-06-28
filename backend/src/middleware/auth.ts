import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = 'egde';
const ADMIN_PASSWORD = 'Elbasan2016!'; // Change this to a strong password
const JWT_SECRET = 'z1ZqAp7aybxGbkEu33Ipz2dwDyGlqbJY9slb08mZd4s/qNRLicLkMpIC3k0ynf//TeFqjvsGzoDLrYI3Fqj7tA=='; // Change this to a strong secret

// Middleware to protect admin routes
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { username: string };
    if (payload.username !== ADMIN_USERNAME) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Optionally attach user info to req
    (req as any).admin = true;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Route handler for login
export function adminLoginHandler(req: Request, res: Response, next: NextFunction) {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
} 