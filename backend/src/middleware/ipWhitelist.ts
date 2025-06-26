import { Request, Response, NextFunction } from 'express';

const allowedIPs = ['193.187.100.76', '::1', '127.0.0.1', '::ffff:127.0.0.1']; // Production IP + localhost for dev

export function ipWhitelist(req: Request, res: Response, next: NextFunction) {
  // Get IP from various possible sources
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.headers['x-real-ip']?.toString() || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.ip || 
             'unknown';

  console.log('Request from IP:', ip);

  if (allowedIPs.includes(ip)) {
    next();
  } else {
    console.log('Access denied for IP:', ip);
    res.status(403).json({ 
      success: false, 
      message: 'Access denied: unauthorized IP',
      ip: ip 
    });
  }
} 