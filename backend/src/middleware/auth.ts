import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = 'egde';
const ADMIN_PASSWORD = 'Elbasan2016!'; // Change this to a strong password
const JWT_SECRET = 'z1ZqAp7aybxGbkEu33Ipz2dwDyGlqbJY9slb08mZd4s/qNRLicLkMpIC3k0ynf//TeFqjvsGzoDLrYI3Fqj7tA=='; // Change this to a strong secret

// Middleware to protect admin routes
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { username: string };
    if (payload.username !== ADMIN_USERNAME) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    // Optionally attach user info to req
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
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
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