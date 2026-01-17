// =============================================================================
// GATEMATE Backend - Validation Middleware Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
    registerSchema,
    loginSchema,
    createDeviceSchema,
    deviceCommandSchema,
    createScheduleSchema,
    guestAccessSchema,
} from '../../src/utils/validation.js';

describe('Validation Schemas', () => {

    // =========================================================================
    // Register Schema Tests
    // =========================================================================
    describe('registerSchema', () => {
        it('should validate correct registration data', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const data = {
                email: 'invalid-email',
                password: 'Password123',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject weak password (no uppercase)', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject weak password (no number)', () => {
            const data = {
                email: 'test@example.com',
                password: 'PasswordABC',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject short password', () => {
            const data = {
                email: 'test@example.com',
                password: 'Pass1',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should trim and lowercase email', () => {
            const data = {
                email: '  TEST@Example.COM  ',
                password: 'Password123',
                name: 'John Doe',
            };

            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('test@example.com');
            }
        });
    });

    // =========================================================================
    // Login Schema Tests
    // =========================================================================
    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const data = {
                email: 'test@example.com',
                password: 'anypassword',
            };

            const result = loginSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject empty password', () => {
            const data = {
                email: 'test@example.com',
                password: '',
            };

            const result = loginSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Device Schema Tests
    // =========================================================================
    describe('createDeviceSchema', () => {
        it('should validate device with all fields', () => {
            const data = {
                name: 'Gerbang Utama',
                type: 'gate',
                ip: '192.168.1.100',
                macAddress: 'AA:BB:CC:DD:EE:FF',
            };

            const result = createDeviceSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should validate device with minimal fields', () => {
            const data = {
                name: 'Gerbang',
                type: 'gate',
            };

            const result = createDeviceSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid device type', () => {
            const data = {
                name: 'Device',
                type: 'invalid',
            };

            const result = createDeviceSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid IP address', () => {
            const data = {
                name: 'Device',
                type: 'gate',
                ip: '999.999.999.999',
            };

            const result = createDeviceSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid MAC address', () => {
            const data = {
                name: 'Device',
                type: 'gate',
                macAddress: 'invalid-mac',
            };

            const result = createDeviceSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Device Command Tests
    // =========================================================================
    describe('deviceCommandSchema', () => {
        it('should validate open command', () => {
            const result = deviceCommandSchema.safeParse({ command: 'open' });
            expect(result.success).toBe(true);
        });

        it('should validate close command', () => {
            const result = deviceCommandSchema.safeParse({ command: 'close' });
            expect(result.success).toBe(true);
        });

        it('should validate command with duration', () => {
            const result = deviceCommandSchema.safeParse({
                command: 'open',
                duration: 5000,
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid command', () => {
            const result = deviceCommandSchema.safeParse({ command: 'destroy' });
            expect(result.success).toBe(false);
        });

        it('should reject negative duration', () => {
            const result = deviceCommandSchema.safeParse({
                command: 'open',
                duration: -1000,
            });
            expect(result.success).toBe(false);
        });

        it('should reject excessive duration', () => {
            const result = deviceCommandSchema.safeParse({
                command: 'open',
                duration: 100000,
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Schedule Schema Tests
    // =========================================================================
    describe('createScheduleSchema', () => {
        it('should validate complete schedule', () => {
            const data = {
                name: 'Buka Pagi',
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                action: 'open',
                time: '07:00',
                days: [1, 2, 3, 4, 5],
            };

            const result = createScheduleSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid time format', () => {
            const data = {
                name: 'Buka',
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                action: 'open',
                time: '25:00',
                days: [1],
            };

            const result = createScheduleSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid device ID', () => {
            const data = {
                name: 'Buka',
                deviceId: 'not-a-uuid',
                action: 'open',
                time: '07:00',
                days: [1],
            };

            const result = createScheduleSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject empty days array', () => {
            const data = {
                name: 'Buka',
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                action: 'open',
                time: '07:00',
                days: [],
            };

            const result = createScheduleSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Guest Access Schema Tests
    // =========================================================================
    describe('guestAccessSchema', () => {
        it('should validate guest access with defaults', () => {
            const data = {
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Guest User',
            };

            const result = guestAccessSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.maxUses).toBe(1);
                expect(result.data.permissions).toEqual(['open']);
            }
        });

        it('should validate guest access with all options', () => {
            const data = {
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'VIP Guest',
                expiresAt: '2026-12-31T23:59:59Z',
                maxUses: 10,
                permissions: ['open', 'close'],
            };

            const result = guestAccessSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject excessive maxUses', () => {
            const data = {
                deviceId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Guest',
                maxUses: 1000,
            };

            const result = guestAccessSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
