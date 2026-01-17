// =============================================================================
// GATEMATE Backend - API Integration Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create test app
const app = express();
app.use(express.json());

// Mock routes for testing
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.0.2',
        timestamp: new Date().toISOString(),
    });
});

app.post('/api/v1/auth/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Email, password, and name are required',
            },
        });
    }

    if (email === 'existing@example.com') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'CONFLICT',
                message: 'Email already registered',
            },
        });
    }

    res.status(201).json({
        success: true,
        data: {
            user: { id: 'user-123', email, name, role: 'user' },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        },
    });
});

app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Email and password are required',
            },
        });
    }

    if (email === 'valid@example.com' && password === 'Password123') {
        return res.json({
            success: true,
            data: {
                user: { id: 'user-123', email, name: 'Test User', role: 'user' },
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            },
        });
    }

    res.status(401).json({
        success: false,
        error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid credentials',
        },
    });
});

// Mock authenticated routes
const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token === 'valid-token') {
        req.user = { userId: 'user-123', email: 'test@example.com', role: 'user' };
        next();
    } else {
        res.status(401).json({
            success: false,
            error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid token' },
        });
    }
};

app.get('/api/v1/devices', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'device-1', name: 'Gerbang Utama', type: 'gate', status: 'online' },
            { id: 'device-2', name: 'Garasi', type: 'garage', status: 'offline' },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
});

app.post('/api/v1/devices/:id/command', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { command } = req.body;

    if (!['open', 'close', 'stop', 'toggle'].includes(command)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid command' },
        });
    }

    res.json({
        success: true,
        message: `Command ${command} sent to device ${id}`,
        data: { deviceId: id, command, sentAt: new Date().toISOString() },
    });
});

// =============================================================================
// Tests
// =============================================================================

describe('API Integration Tests', () => {

    describe('Health Check', () => {
        it('GET /health should return status ok', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.version).toBeDefined();
        });
    });

    describe('Authentication', () => {
        describe('POST /api/v1/auth/register', () => {
            it('should register new user successfully', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        email: 'newuser@example.com',
                        password: 'Password123',
                        name: 'New User',
                    });

                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
                expect(res.body.data.user.email).toBe('newuser@example.com');
                expect(res.body.data.accessToken).toBeDefined();
            });

            it('should return 400 for missing fields', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/register')
                    .send({ email: 'test@example.com' });

                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.error.code).toBe('VALIDATION_ERROR');
            });

            it('should return 409 for existing email', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/register')
                    .send({
                        email: 'existing@example.com',
                        password: 'Password123',
                        name: 'Existing User',
                    });

                expect(res.status).toBe(409);
                expect(res.body.error.code).toBe('CONFLICT');
            });
        });

        describe('POST /api/v1/auth/login', () => {
            it('should login with valid credentials', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email: 'valid@example.com',
                        password: 'Password123',
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data.accessToken).toBeDefined();
            });

            it('should return 401 for invalid credentials', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email: 'invalid@example.com',
                        password: 'WrongPassword',
                    });

                expect(res.status).toBe(401);
                expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
            });

            it('should return 400 for missing fields', async () => {
                const res = await request(app)
                    .post('/api/v1/auth/login')
                    .send({});

                expect(res.status).toBe(400);
            });
        });
    });

    describe('Devices (Protected Routes)', () => {
        describe('GET /api/v1/devices', () => {
            it('should return devices with valid token', async () => {
                const res = await request(app)
                    .get('/api/v1/devices')
                    .set('Authorization', 'Bearer valid-token');

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data).toBeInstanceOf(Array);
                expect(res.body.pagination).toBeDefined();
            });

            it('should return 401 without token', async () => {
                const res = await request(app).get('/api/v1/devices');

                expect(res.status).toBe(401);
                expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
            });

            it('should return 401 with invalid token', async () => {
                const res = await request(app)
                    .get('/api/v1/devices')
                    .set('Authorization', 'Bearer invalid-token');

                expect(res.status).toBe(401);
            });
        });

        describe('POST /api/v1/devices/:id/command', () => {
            it('should send command successfully', async () => {
                const res = await request(app)
                    .post('/api/v1/devices/device-1/command')
                    .set('Authorization', 'Bearer valid-token')
                    .send({ command: 'open' });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data.command).toBe('open');
            });

            it('should return 400 for invalid command', async () => {
                const res = await request(app)
                    .post('/api/v1/devices/device-1/command')
                    .set('Authorization', 'Bearer valid-token')
                    .send({ command: 'invalid' });

                expect(res.status).toBe(400);
                expect(res.body.error.code).toBe('VALIDATION_ERROR');
            });
        });
    });
});
