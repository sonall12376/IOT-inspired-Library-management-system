"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./logger");
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartlibrary';
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(mongoUri);
        logger_1.logger.info('Successfully connected to MongoDB.');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('MongoDB connection disconnected. Attempting to reconnect...');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('MongoDB error occurred:', err);
});
