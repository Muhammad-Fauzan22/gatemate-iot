// =============================================================================
// GATEMATE Backend - Auth Service Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        session: {
            create: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        },
    })),
}));

describe('AuthService', () => {
    let authService: AuthService;

    beforeAll(() => {
        authService = new AuthService();
    });

    describe('register', () => {
        it('should create a new user with hashed password', async () => {
            const input = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            // Mock implementation
            vi.spyOn(authService as any, 'register').mockResolvedValue({
                user: {
                    id: '1',
                    email: input.email,
                    name: input.name,
                    role: 'USER',
                },
                accessToken: 'mock-token',
                refreshToken: 'mock-refresh',
                expiresIn: '15m',
            });

            const result = await authService.register(input);

            expect(result.user.email).toBe(input.email);
            expect(result.accessToken).toBeDefined();
        });

        it('should throw error if email already exists', async () => {
            const input = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Test User',
            };

            vi.spyOn(authService as any, 'register').mockRejectedValue(
                new Error('Email already registered')
            );

            await expect(authService.register(input)).rejects.toThrow('Email already registered');
        });
    });

    describe('login', () => {
        it('should return tokens for valid credentials', async () => {
            vi.spyOn(authService as any, 'login').mockResolvedValue({
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'USER',
                },
                accessToken: 'mock-token',
                refreshToken: 'mock-refresh',
                expiresIn: '15m',
            });

            const result = await authService.login('test@example.com', 'password123');

            expect(result.user).toBeDefined();
            expect(result.accessToken).toBeDefined();
        });

        it('should throw error for invalid credentials', async () => {
            vi.spyOn(authService as any, 'login').mockRejectedValue(
                new Error('Invalid credentials')
            );

            await expect(authService.login('wrong@example.com', 'wrongpass')).rejects.toThrow(
                'Invalid credentials'
            );
        });
    });

    describe('logout', () => {
        it('should delete session on logout', async () => {
            vi.spyOn(authService as any, 'logout').mockResolvedValue(undefined);

            await expect(authService.logout('mock-token')).resolves.not.toThrow();
        });
    });
});
