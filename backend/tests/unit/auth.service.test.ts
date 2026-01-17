// =============================================================================
// GATEMATE Backend - Auth Service Unit Tests
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma
const mockPrisma = {
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
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock config
vi.mock('../../config/env.js', () => ({
    config: {
        JWT_SECRET: 'test-secret-key',
        JWT_EXPIRES_IN: '24h',
        JWT_REFRESH_EXPIRES_IN: '7d',
    },
}));

import { AuthService } from '../auth.service.js';

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // =========================================================================
    // Register Tests
    // =========================================================================
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const input = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'Test User',
            };

            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-123',
                email: input.email,
                name: input.name,
                role: 'user',
                createdAt: new Date(),
            });
            mockPrisma.session.create.mockResolvedValue({
                id: 'session-123',
            });

            const result = await authService.register(input);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(input.email);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it('should throw error if email already exists', async () => {
            const input = {
                email: 'existing@example.com',
                password: 'Password123',
                name: 'Test User',
            };

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: input.email,
            });

            await expect(authService.register(input)).rejects.toThrow('Email already registered');
        });

        it('should hash password before storing', async () => {
            const input = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'Test User',
            };

            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockImplementation(async ({ data }) => {
                // Verify password is hashed
                expect(data.password).not.toBe(input.password);
                expect(await bcrypt.compare(input.password, data.password)).toBe(true);
                return {
                    id: 'user-123',
                    email: data.email,
                    name: data.name,
                    role: 'user',
                    createdAt: new Date(),
                };
            });
            mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

            await authService.register(input);

            expect(mockPrisma.user.create).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Login Tests
    // =========================================================================
    describe('login', () => {
        it('should login with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('Password123', 12);

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
                role: 'user',
                avatar: null,
            });
            mockPrisma.user.update.mockResolvedValue({});
            mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

            const result = await authService.login('test@example.com', 'Password123');

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('test@example.com');
            expect(result.accessToken).toBeDefined();
        });

        it('should throw error for invalid email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                authService.login('nonexistent@example.com', 'Password123')
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw error for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('CorrectPassword', 12);

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
            });

            await expect(
                authService.login('test@example.com', 'WrongPassword')
            ).rejects.toThrow('Invalid credentials');
        });

        it('should update lastLoginAt on successful login', async () => {
            const hashedPassword = await bcrypt.hash('Password123', 12);

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
                role: 'user',
            });
            mockPrisma.user.update.mockResolvedValue({});
            mockPrisma.session.create.mockResolvedValue({ id: 'session-123' });

            await authService.login('test@example.com', 'Password123');

            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-123' },
                    data: expect.objectContaining({
                        lastLoginAt: expect.any(Date),
                    }),
                })
            );
        });
    });

    // =========================================================================
    // Refresh Token Tests
    // =========================================================================
    describe('refreshToken', () => {
        it('should refresh token with valid refresh token', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            mockPrisma.session.findUnique.mockResolvedValue({
                id: 'session-123',
                refreshToken: 'valid-refresh-token',
                expiresAt: futureDate,
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    role: 'user',
                },
            });
            mockPrisma.session.delete.mockResolvedValue({});
            mockPrisma.session.create.mockResolvedValue({ id: 'new-session' });

            const result = await authService.refreshToken('valid-refresh-token');

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it('should throw error for expired refresh token', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            mockPrisma.session.findUnique.mockResolvedValue({
                id: 'session-123',
                refreshToken: 'expired-token',
                expiresAt: pastDate,
                user: { id: 'user-123' },
            });

            await expect(
                authService.refreshToken('expired-token')
            ).rejects.toThrow('Invalid or expired refresh token');
        });

        it('should throw error for invalid refresh token', async () => {
            mockPrisma.session.findUnique.mockResolvedValue(null);

            await expect(
                authService.refreshToken('invalid-token')
            ).rejects.toThrow('Invalid or expired refresh token');
        });
    });

    // =========================================================================
    // Logout Tests
    // =========================================================================
    describe('logout', () => {
        it('should delete session on logout', async () => {
            mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

            await authService.logout('valid-token');

            expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
                where: { token: 'valid-token' },
            });
        });
    });

    // =========================================================================
    // Get Profile Tests
    // =========================================================================
    describe('getProfile', () => {
        it('should return user profile', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                avatar: null,
                role: 'user',
                createdAt: new Date(),
                lastLoginAt: new Date(),
            });

            const result = await authService.getProfile('user-123');

            expect(result.id).toBe('user-123');
            expect(result.email).toBe('test@example.com');
        });

        it('should throw error for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(authService.getProfile('non-existent')).rejects.toThrow('User not found');
        });
    });

    // =========================================================================
    // Change Password Tests
    // =========================================================================
    describe('changePassword', () => {
        it('should change password with correct current password', async () => {
            const currentHash = await bcrypt.hash('OldPassword123', 12);

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                password: currentHash,
            });
            mockPrisma.user.update.mockResolvedValue({});
            mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

            await authService.changePassword('user-123', 'OldPassword123', 'NewPassword456');

            expect(mockPrisma.user.update).toHaveBeenCalled();
            expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            });
        });

        it('should throw error for incorrect current password', async () => {
            const currentHash = await bcrypt.hash('CorrectPassword', 12);

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                password: currentHash,
            });

            await expect(
                authService.changePassword('user-123', 'WrongPassword', 'NewPassword456')
            ).rejects.toThrow('Current password is incorrect');
        });
    });
});
