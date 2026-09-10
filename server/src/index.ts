import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple Request Logger
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root Ping Route
app.get('/', (_req, res) => {
  res.json({
    message: 'SIH-Apex Backend API is active',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

// Mount API Routes
app.use('/api', apiRouter);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SIH-Apex Backend Server is running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  DB Health: http://localhost:${PORT}/api/health/db`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});
