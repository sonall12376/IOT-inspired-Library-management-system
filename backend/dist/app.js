"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const logger_1 = require("./config/logger");
const db_1 = require("./config/db");
const error_1 = require("./middlewares/error");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev; specify in prod config
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
exports.io = io;
// Configure Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root health check endpoint
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
// Basic check mapping
app.get('/api', (_req, res) => {
    res.status(200).json({ message: 'SmartLibrary AI Backend System REST API v1.0.0' });
});
// Apply centralized error handling middleware as the last middleware
app.use(error_1.errorHandler);
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // 1. Connect database
        await (0, db_1.connectDB)();
        // 2. Setup WebSocket handlers (placeholder for now)
        io.on('connection', (socket) => {
            logger_1.logger.debug(`Client connected to WebSocket: ${socket.id}`);
            socket.on('disconnect', () => {
                logger_1.logger.debug(`Client disconnected from WebSocket: ${socket.id}`);
            });
        });
        // 3. Start Listening
        server.listen(PORT, () => {
            logger_1.logger.info(`SmartLibrary AI server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
