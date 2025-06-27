"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.PaymentError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.BaseError = void 0;
class BaseError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;
class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends BaseError {
    constructor(message = 'Not authenticated') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends BaseError {
    constructor(message = 'Not authorized') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends BaseError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends BaseError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class PaymentError extends BaseError {
    constructor(message) {
        super(message, 400, 'PAYMENT_ERROR');
    }
}
exports.PaymentError = PaymentError;
class DatabaseError extends BaseError {
    constructor(message) {
        super(message, 500, 'DATABASE_ERROR');
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends BaseError {
    constructor(service, message) {
        super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends BaseError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
// Error messages
exports.ErrorMessages = {
    validation: {
        required: (field) => `${field} is required`,
        invalid: (field) => `Invalid ${field}`,
        minLength: (field, length) => `${field} must be at least ${length} characters`,
        maxLength: (field, length) => `${field} must not exceed ${length} characters`,
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        positive: (field) => `${field} must be greater than 0`,
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
};
//# sourceMappingURL=errors.js.map