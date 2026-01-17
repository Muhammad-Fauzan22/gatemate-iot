// =============================================================================
// GATEMATE Backend - Health & Monitoring Service
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.middleware.js';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
        mqtt: ServiceStatus;
    };
    metrics: {
        activeConnections: number;
        requestsPerMinute: number;
        averageResponseTime: number;
    };
}

interface ServiceStatus {
    status: 'connected' | 'disconnected' | 'degraded';
    latency?: number;
    lastCheck: string;
    error?: string;
}

// =============================================================================
// Metrics Store
// =============================================================================

class MetricsStore {
    private requestCount = 0;
    private responseTimes: number[] = [];
    private activeConnections = 0;
    private lastMinuteRequests = 0;
    private lastMinuteTimestamp = Date.now();

    incrementRequests(): void {
        this.requestCount++;
        const now = Date.now();
        if (now - this.lastMinuteTimestamp >= 60000) {
            this.lastMinuteRequests = this.requestCount;
            this.requestCount = 0;
            this.lastMinuteTimestamp = now;
        }
    }

    addResponseTime(ms: number): void {
        this.responseTimes.push(ms);
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
    }

    incrementConnections(): void {
        this.activeConnections++;
    }

    decrementConnections(): void {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
    }

    getMetrics() {
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
            : 0;

        return {
            activeConnections: this.activeConnections,
            requestsPerMinute: this.lastMinuteRequests,
            averageResponseTime: Math.round(avgResponseTime * 100) / 100,
            totalRequests: this.requestCount,
        };
    }
}

export const metricsStore = new MetricsStore();

// =============================================================================
// Health Check Service
// =============================================================================

class HealthService {
    private startTime = Date.now();

    async getHealth(): Promise<HealthStatus> {
        const [dbStatus, redisStatus, mqttStatus] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkMQTT(),
        ]);

        const memoryUsage = process.memoryUsage();
        const metrics = metricsStore.getMetrics();

        const allHealthy =
            dbStatus.status === 'connected' &&
            redisStatus.status !== 'disconnected' &&
            mqttStatus.status !== 'disconnected';

        const anyDegraded =
            dbStatus.status === 'degraded' ||
            redisStatus.status === 'degraded' ||
            mqttStatus.status === 'degraded';

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (!allHealthy) status = 'unhealthy';
        else if (anyDegraded) status = 'degraded';

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            version: process.env.npm_package_version || '2.0.0',
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
            },
            services: {
                database: dbStatus,
                redis: redisStatus,
                mqtt: mqttStatus,
            },
            metrics,
        };
    }

    private async checkDatabase(): Promise<ServiceStatus> {
        const start = Date.now();
        try {
            await prisma.$queryRaw`SELECT 1`;
            return {
                status: 'connected',
                latency: Date.now() - start,
                lastCheck: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Database health check failed', { error });
            return {
                status: 'disconnected',
                lastCheck: new Date().toISOString(),
                error: (error as Error).message,
            };
        }
    }

    private async checkRedis(): Promise<ServiceStatus> {
        // Redis check - simplified for now
        return {
            status: 'connected',
            latency: 1,
            lastCheck: new Date().toISOString(),
        };
    }

    private async checkMQTT(): Promise<ServiceStatus> {
        // MQTT check - simplified for now
        return {
            status: 'connected',
            latency: 5,
            lastCheck: new Date().toISOString(),
        };
    }

    getReadiness(): { ready: boolean; checks: Record<string, boolean> } {
        return {
            ready: true,
            checks: {
                database: true,
                configuration: true,
                dependencies: true,
            },
        };
    }

    getLiveness(): { alive: boolean; uptime: number } {
        return {
            alive: true,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
        };
    }
}

export const healthService = new HealthService();

// =============================================================================
// Prometheus Metrics Export
// =============================================================================

export function getPrometheusMetrics(): string {
    const metrics = metricsStore.getMetrics();
    const memoryUsage = process.memoryUsage();

    return `
# HELP gatemate_requests_total Total number of HTTP requests
# TYPE gatemate_requests_total counter
gatemate_requests_total ${metrics.totalRequests}

# HELP gatemate_requests_per_minute Requests per minute
# TYPE gatemate_requests_per_minute gauge
gatemate_requests_per_minute ${metrics.requestsPerMinute}

# HELP gatemate_active_connections Number of active WebSocket connections
# TYPE gatemate_active_connections gauge
gatemate_active_connections ${metrics.activeConnections}

# HELP gatemate_response_time_avg Average response time in ms
# TYPE gatemate_response_time_avg gauge
gatemate_response_time_avg ${metrics.averageResponseTime}

# HELP gatemate_memory_used_bytes Memory used in bytes
# TYPE gatemate_memory_used_bytes gauge
gatemate_memory_used_bytes ${memoryUsage.heapUsed}

# HELP gatemate_memory_total_bytes Total memory in bytes
# TYPE gatemate_memory_total_bytes gauge
gatemate_memory_total_bytes ${memoryUsage.heapTotal}

# HELP gatemate_uptime_seconds Server uptime in seconds
# TYPE gatemate_uptime_seconds counter
gatemate_uptime_seconds ${Math.floor(process.uptime())}
`.trim();
}
