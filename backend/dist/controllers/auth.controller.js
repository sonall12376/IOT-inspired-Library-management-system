"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../config/logger");
class AuthController {
    /**
     * Register User Handler
     */
    static async register(req, res, next) {
        try {
            logger_1.logger.info(`Attempting to register user: ${req.body.email}`);
            const user = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login User Handler
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            logger_1.logger.info(`User login attempt: ${email}`);
            const result = await auth_service_1.AuthService.login(email, password);
            res.status(200).json({
                success: true,
                token: result.token,
                user: result.user
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get Profile Handler
     */
    static async getProfile(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await auth_service_1.AuthService.getProfile(req.user.id);
            res.status(200).json({
                success: true,
                user
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
