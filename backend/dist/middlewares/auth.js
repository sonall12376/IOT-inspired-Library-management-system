"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.validateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("./error");
const User_1 = require("../models/User");
const logger_1 = require("../config/logger");
const validateJWT = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new error_1.AppError('Authentication required. Please sign in.', 401));
        }
        const secret = process.env.JWT_SECRET || 'development_secret_session_token_key_19283';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Verify user still exists in database
        const userExists = await User_1.User.findById(decoded.id).select('_id');
        if (!userExists) {
            return next(new error_1.AppError('Session user no longer exists.', 401));
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (err) {
        logger_1.logger.warn('Token validation failed:', err.message);
        next(err);
    }
};
exports.validateJWT = validateJWT;
const requireRole = (allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new error_1.AppError('Authentication required.', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_1.AppError('Access denied. Insufficient permissions.', 403));
        }
        next();
    };
};
exports.requireRole = requireRole;
