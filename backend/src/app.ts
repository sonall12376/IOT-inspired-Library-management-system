import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './config/logger';
import { connectDB } from './config/db';
import { errorHandler } from './middlewares/error';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for dev; specify in prod config
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

import authRouter from './routes/auth.routes';
import floorRouter from './routes/floor.routes';
import seatRouter from './routes/seat.routes';

// Configure Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Basic check mapping
app.get('/api', (_req, res) => {
  res.status(200).json({ message: 'SmartLibrary AI Backend System REST API v1.0.0' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/floors', floorRouter);
app.use('/api/seats', seatRouter);

// Apply centralized error handling middleware as the last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect database
    await connectDB();

    // 2. Setup WebSocket handlers (placeholder for now)
    io.on('connection', (socket) => {
      logger.debug(`Client connected to WebSocket: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.debug(`Client disconnected from WebSocket: ${socket.id}`);
      });
    });

    // 3. Start Listening
    server.listen(PORT, () => {
      logger.info(`SmartLibrary AI server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
export default app;
