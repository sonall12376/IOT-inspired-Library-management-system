"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const error_1 = require("../middlewares/error");
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_session_token_key_19283';
const JWT_EXPIRES_IN = '24h';
class AuthService {
    /**
     * Register a new user
     */
    static async register(payload) {
        const { email } = payload;
        if (!email) {
            throw new error_1.AppError('Email is required', 400);
        }
        // Check if email already registered
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            throw new error_1.AppError('An account with this email address already exists', 400);
        }
        // Default first registered user to Admin for bootstrapping, otherwise Student
        const userCount = await User_1.User.countDocuments();
        const assignedRole = userCount === 0 ? 'admin' : (payload.role || 'student');
        const newUser = new User_1.User({
            ...payload,
            role: assignedRole
        });
        await newUser.save();
        // Clean password from return object
        newUser.password = undefined;
        return newUser;
    }
    /**
     * Authenticate a user and sign JWT
     */
    static async login(email, password) {
        const user = await User_1.User.findOne({ email });
        if (!user) {
            throw new error_1.AppError('Invalid email or password', 401);
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new error_1.AppError('Invalid email or password', 401);
        }
        // Sign Token
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        user.password = undefined;
        return { token, user };
    }
    /**
     * Fetch profile by ID
     */
    static async getProfile(userId) {
        const user = await User_1.User.findById(userId).select('-password');
        if (!user) {
            throw new error_1.AppError('User profile not found', 404);
        }
        return user;
    }
}
exports.AuthService = AuthService;
