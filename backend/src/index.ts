// =============================================================================
// GATEMATE Backend - Updated Main Entry Point with Security
// =============================================================================

import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env.js';

// Middleware imports
import {
    helmetMiddleware,
    corsMiddleware,
    apiLimiter,
    authLimiter,
    commandLimiter,
    guestLimiter,
    sanitizeInput,
    additionalSecurityHeaders,
    requestIdMiddleware,
} from './middleware/security.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger, logger } from './middleware/logger.middleware.js';

// Route imports
import { authRouter } from './modules/auth/auth.routes.js';
import { deviceRouter } from './modules/devices/device.routes.js';
import { commandRouter } from './modules/commands/command.routes.js';
import { scheduleRouter } from './modules/schedules/schedule.routes.js';
import { guestRouter } from './modules/guest/guest.routes.js';
import { pairingRouter } from './modules/pairing/pairing.routes.js';
import { diagnosticsRouter } from './modules/diagnostics/diagnostics.routes.js';
import { invitationRouter } from './modules/users/invitation.routes.js';

// Services
import { setupMQTT } from './modules/mqtt/mqtt.service.js';
import { setupWebSocket } from './modules/websocket/websocket.service.js';
import { connectRedis } from './utils/redis.js';

// =============================================================================
// Express App Setup
// =============================================================================

const app = express();
const httpServer = createServer(app);

// =============================================================================
// WebSocket Setup
// =============================================================================

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// =============================================================================
// Global Middleware (Order Matters!)
// =============================================================================

// 1. Request ID for tracing
app.use(requestIdMiddleware);

// 2. Security headers
app.use(helmetMiddleware);
app.use(additionalSecurityHeaders);

// 3. CORS
app.use(corsMiddleware);

// 4. Request logging
app.use(requestLogger);

// 5. Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Input sanitization
app.use(sanitizeInput);

// 7. General rate limiting
app.use('/api/', apiLimiter);

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        version: '2.0.5',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
    });
});

// =============================================================================
// API v1 Routes with Specific Rate Limits
// =============================================================================

// Auth routes with strict rate limiting
app.use('/api/v1/auth', authLimiter, authRouter);

// Device management
app.use('/api/v1/devices', deviceRouter);

// Command routes with command-specific rate limiting
app.use('/api/v1/commands', commandLimiter, commandRouter);

// Schedule management
app.use('/api/v1/schedules', scheduleRouter);

// Guest access with guest-specific rate limiting
app.use('/api/v1/guest', guestLimiter, guestRouter);

// Device pairing
app.use('/api/v1/pairing', pairingRouter);

// Diagnostics
app.use('/api/v1/diagnostics', diagnosticsRouter);

// User management
app.use('/api/v1/users', invitationRouter);

// =============================================================================
// 404 Handler
// =============================================================================

app.use(notFoundHandler);

// =============================================================================
// Global Error Handler (Must be last)
// =============================================================================

app.use(errorHandler);

// =============================================================================
// Server Startup
// =============================================================================

const startServer = async () => {
    try {
        // Connect to Redis (optional, graceful degradation)
        const redis = await connectRedis();
        if (redis) {
            logger.info('✓ Redis connected');
        }

        // Setup MQTT
        if (config.MQTT_BROKER_URL) {
            await setupMQTT(io);
            logger.info('✓ MQTT connected');
        }

        // Setup WebSocket
        setupWebSocket(io);
        logger.info('✓ WebSocket ready');

        // Start HTTP server
        httpServer.listen(config.PORT, () => {
            logger.info('========================================');
            logger.info('   GATEMATE API Server');
            logger.info(`   Environment: ${config.NODE_ENV}`);
            logger.info(`   Port: ${config.PORT}`);
            logger.info(`   CORS: ${config.CORS_ORIGIN}`);
            logger.info('========================================');
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// =============================================================================
// Graceful Shutdown
// =============================================================================

const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    httpServer.close(() => {
        logger.info('HTTP server closed');
    });

    // Close WebSocket connections
    io.close(() => {
        logger.info('WebSocket server closed');
    });

    // Allow 10 seconds for cleanup
    setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
startServer();

// Export for testing
export { app, httpServer, io };
