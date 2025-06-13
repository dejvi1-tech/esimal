import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface SignupTokenPayload {
  email: string;
  orderId: string;
  exp: number;
}

export const generateSignupToken = (email: string, orderId: string): string => {
  const payload: SignupTokenPayload = {
    email,
    orderId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
  };

  return jwt.sign(payload, JWT_SECRET);
};

export const verifySignupToken = (token: string): { email: string; orderId: string } => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SignupTokenPayload;
    return {
      email: payload.email,
      orderId: payload.orderId,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}; 