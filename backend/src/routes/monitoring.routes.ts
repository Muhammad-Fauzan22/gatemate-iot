// =============================================================================
// GATEMATE Backend - Monitoring Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import { healthService, getPrometheusMetrics, metricsStore } from '../services/health.service.js';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/health', async (_req: Request, res: Response) => {
    const health = await healthService.getHealth();
    const statusCode = health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/health/live', (_req: Request, res: Response) => {
    const liveness = healthService.getLiveness();
    res.status(liveness.alive ? 200 : 503).json(liveness);
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/health/ready', (_req: Request, res: Response) => {
    const readiness = healthService.getReadiness();
    res.status(readiness.ready ? 200 : 503).json(readiness);
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', (_req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send(getPrometheusMetrics());
});

/**
 * GET /status
 * Detailed system status
 */
router.get('/status', async (_req: Request, res: Response) => {
    const health = await healthService.getHealth();
    res.json({
        success: true,
        data: {
            ...health,
            environment: process.env.NODE_ENV,
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
        },
    });
});

export { router as monitoringRouter };
