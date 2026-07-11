"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['student', 'librarian', 'admin'],
        default: 'student'
    },
    dailyBookingCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});
// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    if (this.password) {
        const salt = await bcrypt_1.default.genSalt(12);
        this.password = await bcrypt_1.default.hash(this.password, salt);
    }
});
// Helper method to compare password
UserSchema.methods.comparePassword = async function (password) {
    return bcrypt_1.default.compare(password, this.password || '');
};
exports.User = (0, mongoose_1.model)('User', UserSchema);
exports.default = exports.User;
