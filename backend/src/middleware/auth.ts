import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
  throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET must be set in environment variables');
}

// Type assertion for JWT_SECRET
const JWT_SECRET_STR: string = JWT_SECRET as string;

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
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
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
    const payload = jwt.verify(token, JWT_SECRET_STR) as { username: string };
    if (payload.username !== ADMIN_USERNAME) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    // Attach admin info to req
    (req as any).admin = true;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
    return;
  }
}

// Route handler for login
export function adminLoginHandler(req: Request, res: Response, next: NextFunction): void {
  console.log('🔐 Admin login attempt');
  console.log('📝 Request body:', req.body);
  console.log('🔑 Expected username:', ADMIN_USERNAME);
  console.log('🔑 Expected password:', ADMIN_PASSWORD);
  
  const { username, password } = req.body;
  
  console.log('📝 Received username:', username);
  console.log('📝 Received password:', password);
  
  if (!username || !password) {
    console.log('❌ Missing username or password');
    res.status(400).json({ 
      success: false,
      error: 'Username and password are required' 
    });
    return;
  }
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    console.log('✅ Login successful');
    const token = jwt.sign({ username }, JWT_SECRET_STR, { expiresIn: '8h' });
    // Set JWT as cookie for parallel cookie/localStorage support
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true, // Set to true in production (requires HTTPS)
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
    res.json({ 
      success: true,
      token,
      message: 'Login successful'
    });
    return;
  }
  
  console.log('❌ Invalid credentials');
  res.status(401).json({ 
    success: false,
    error: 'Invalid username or password' 
  });
  return;
}

// Route handler for logout (optional - for server-side session management)
export function adminLogoutHandler(req: Request, res: Response, next: NextFunction): void {
  // Since we're using JWT tokens stored in localStorage, 
  // the actual logout happens on the client side
  // This endpoint can be used for any server-side cleanup if needed
  res.json({ 
    success: true,
    message: 'Logout successful' 
  });
} 