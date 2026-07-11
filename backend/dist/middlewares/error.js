"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../config/logger");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Log inside system
    if (err.statusCode >= 500) {
        logger_1.logger.error('Unhandled System Error:', err);
    }
    else {
        logger_1.logger.warn(`Operational Warning [${err.statusCode}]: ${err.message}`);
    }
    // Mongoose CastError (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: `Invalid format for field: ${err.path}`
        });
        return;
    }
    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const value = Object.keys(err.keyValue).join(', ');
        res.status(400).json({
            success: false,
            message: `Duplicate field value: ${value}. Please use another value.`
        });
        return;
    }
    // Express validation or Zod parsing errors
    if (err.name === 'ValidationError' || err.issues) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.issues || err.message
        });
        return;
    }
    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid session token. Please sign in again.'
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Session token has expired. Please sign in again.'
        });
        return;
    }
    // Send output to user
    res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};
exports.errorHandler = errorHandler;
