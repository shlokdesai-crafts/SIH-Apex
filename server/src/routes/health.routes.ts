import { Router, Request, Response } from 'express';
import { testDbConnection } from '../config/database.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Check system health status and uptime
 * @access  Public
 */
router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'untested';
  try {
    const dbTest = await testDbConnection();
    dbStatus = dbTest.connected ? 'connected' : 'disconnected';
  } catch {
    dbStatus = 'error';
  }

  res.status(200).json({
    status: 'ok',
    service: 'SIH-Apex Backend API',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    message: 'Backend server is healthy and running smoothly.',
  });
});

/**
 * @route   GET /api/health/db
 * @desc    Test PostgreSQL database connection and return diagnostic metrics
 * @access  Public
 */
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const diagnostics = await testDbConnection();
    res.status(200).json({
      status: 'success',
      databaseStatus: 'connected',
      engine: 'PostgreSQL',
      version: diagnostics.version,
      database: diagnostics.database,
      user: diagnostics.user,
      latency: `${diagnostics.latencyMs}ms`,
      serverTime: diagnostics.timestamp,
      message: 'PostgreSQL 18 connection test successful!',
    });
  } catch (error: any) {
    console.error('[Health/DB Error]:', error);
    res.status(503).json({
      status: 'error',
      databaseStatus: 'disconnected',
      engine: 'PostgreSQL',
      message: 'Failed to connect to PostgreSQL database.',
      error: error?.message || 'Unknown database connection error',
    });
  }
});

export default router;
