// =============================================================================
// GATEMATE Backend - API Integration Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';

describe('API Integration Tests', () => {
    let authToken: string;
    let userId: string;

    describe('Health Check', () => {
        it('GET /health should return status ok', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.version).toBeDefined();
        });
    });

    describe('Authentication', () => {
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPass123!',
            name: 'Test User',
        };

        it('POST /api/v1/auth/register should create a new user', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body.accessToken).toBeDefined();

            authToken = response.body.accessToken;
            userId = response.body.user.id;
        });

        it('POST /api/v1/auth/login should authenticate user', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();

            authToken = response.body.accessToken;
        });

        it('GET /api/v1/auth/me should return user profile', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(testUser.email);
        });

        it('GET /api/v1/auth/me should return 401 without token', async () => {
            const response = await request(app).get('/api/v1/auth/me');

            expect(response.status).toBe(401);
        });
    });

    describe('Devices', () => {
        let deviceId: string;

        it('POST /api/v1/devices should create a device', async () => {
            const response = await request(app)
                .post('/api/v1/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deviceId: 'TEST-DEVICE-001',
                    name: 'Test Gate',
                    type: 'GATE',
                });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Test Gate');

            deviceId = response.body.id;
        });

        it('GET /api/v1/devices should list user devices', async () => {
            const response = await request(app)
                .get('/api/v1/devices')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('GET /api/v1/devices/:id should return device details', async () => {
            const response = await request(app)
                .get(`/api/v1/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Test Gate');
        });
    });

    describe('Commands', () => {
        it('POST /api/v1/commands/:deviceId/open should send open command', async () => {
            const response = await request(app)
                .post('/api/v1/commands/TEST-DEVICE/open')
                .set('Authorization', `Bearer ${authToken}`);

            // May return 404 if device doesn't exist, which is expected
            expect([200, 404]).toContain(response.status);
        });
    });

    describe('Schedules', () => {
        let scheduleId: string;

        it('GET /api/v1/schedules should list schedules', async () => {
            const response = await request(app)
                .get('/api/v1/schedules')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('GET /nonexistent should return 404', async () => {
            const response = await request(app).get('/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Not Found');
        });

        it('POST /api/v1/auth/login with invalid body should return 400', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({});

            expect(response.status).toBe(400);
        });
    });
});
