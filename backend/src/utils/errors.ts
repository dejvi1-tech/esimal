export class BaseError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Not authenticated') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Not authorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class PaymentError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'PAYMENT_ERROR');
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Error messages
export const ErrorMessages = {
  validation: {
    required: (field: string) => `${field} is required`,
    invalid: (field: string) => `Invalid ${field}`,
    minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
    maxLength: (field: string, length: number) => `${field} must not exceed ${length} characters`,
    email: 'Invalid email format',
    password: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    positive: (field: string) => `${field} must be greater than 0`,
  },
  auth: {
    invalidCredentials: 'Invalid email or password',
    invalidToken: 'Invalid or expired token',
    emailExists: 'Email already exists',
    notAuthenticated: 'Not authenticated',
    notAuthorized: 'Not authorized',
    invalidVerificationToken: 'Invalid or expired verification token',
    invalidResetToken: 'Invalid or expired reset token',
  },
  order: {
    notFound: 'Order not found',
    invalidStatus: 'Invalid order status',
    notEligibleForRefund: 'Order is not eligible for refund',
    paymentFailed: 'Payment processing failed',
    alreadyCancelled: 'Order is already cancelled',
  },
  package: {
    notFound: 'Package not found',
    inactive: 'Package is not active',
    outOfStock: 'Package is out of stock',
    nameExists: 'A package with this name already exists',
    hasActiveOrders: 'Cannot delete package with active orders',
  },
  user: {
    notFound: 'User not found',
    alreadyExists: 'User already exists',
    notVerified: 'Email not verified',
  },
  payment: {
    failed: 'Payment failed',
    refundFailed: 'Refund failed',
    invalidAmount: 'Invalid payment amount',
  },
  general: {
    serverError: 'Internal server error',
    notImplemented: 'Feature not implemented',
    maintenance: 'Service is under maintenance',
  },
} as const; 