"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
}));
const transports = [
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
];
if (process.env.NODE_ENV === 'production') {
    const logDirectory = path_1.default.join(__dirname, '../../../logs');
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDirectory, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '14d',
        level: 'error',
        format: logFormat
    }), new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDirectory, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '14d',
        level: 'info',
        format: logFormat
    }));
}
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports
});
