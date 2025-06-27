"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error:', err);
    // Also log to console for debugging
    console.error('API Error:', err);
    if (err && err.stack) {
        console.error('Stack:', err.stack);
    }
    if (err instanceof errors_1.ValidationError) {
        return res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }
    if (err instanceof errors_1.AuthenticationError) {
        return res.status(401).json({
            status: 'error',
            message: err.message,
        });
    }
    if (err instanceof errors_1.NotFoundError) {
        return res.status(404).json({
            status: 'error',
            message: err.message,
        });
    }
    // Default error
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map