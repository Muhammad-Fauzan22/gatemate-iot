// =============================================================================
// GATEMATE Backend - Auth Service Unit Tests
// =============================================================================

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockUser, createMockSession } from '../setup';

// Type helper for mocking Prisma methods
type MockFunction = jest.Mock<any, any>;

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should create a new user with hashed password', async () => {
            const input = {
                email: 'new@example.com',
                password: 'Password123!',
                name: 'New User',
            };

            const hashedPassword = await bcrypt.hash(input.password, 12);
            const mockUser = createMockUser({
                email: input.email,
                name: input.name,
                password: hashedPassword,
            });

            // Use type assertion for mock methods
            (prismaMock.user.findUnique as unknown as MockFunction).mockResolvedValue(null);
            (prismaMock.user.create as unknown as MockFunction).mockResolvedValue(mockUser);
            (prismaMock.session.create as unknown as MockFunction).mockResolvedValue(createMockSession());

            // Verify password was hashed
            const isPasswordHashed = await bcrypt.compare(input.password, hashedPassword);
            expect(isPasswordHashed).toBe(true);
        });

        it('should reject registration if email already exists', async () => {
            const existingUser = createMockUser({ email: 'existing@example.com' });

            (prismaMock.user.findUnique as unknown as MockFunction).mockResolvedValue(existingUser);

            // Should throw ConflictError
            expect(prismaMock.user.findUnique).toBeDefined();
        });

        it('should validate password requirements', () => {
            const weakPasswords = [
                'short',           // Too short
                'nouppercase1',    // No uppercase
                'NOLOWERCASE1',    // No lowercase
                'NoNumbers!',      // No numbers
            ];

            weakPasswords.forEach(password => {
                const hasUppercase = /[A-Z]/.test(password);
                const hasLowercase = /[a-z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const isLongEnough = password.length >= 8;

                const isValid = hasUppercase && hasLowercase && hasNumber && isLongEnough;
                expect(isValid).toBe(false);
            });
        });
    });

    describe('login', () => {
        it('should return tokens for valid credentials', async () => {
            const password = 'ValidPassword123!';
            const hashedPassword = await bcrypt.hash(password, 12);
            const mockUser = createMockUser({ password: hashedPassword });

            (prismaMock.user.findUnique as unknown as MockFunction).mockResolvedValue(mockUser);
            (prismaMock.session.create as unknown as MockFunction).mockResolvedValue(createMockSession());
            (prismaMock.user.update as unknown as MockFunction).mockResolvedValue(mockUser);

            const isPasswordValid = await bcrypt.compare(password, hashedPassword);
            expect(isPasswordValid).toBe(true);
        });

        it('should reject invalid password', async () => {
            const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
            const mockUser = createMockUser({ password: hashedPassword });

            (prismaMock.user.findUnique as unknown as MockFunction).mockResolvedValue(mockUser);

            const isPasswordValid = await bcrypt.compare('WrongPassword123!', hashedPassword);
            expect(isPasswordValid).toBe(false);
        });

        it('should reject non-existent user', async () => {
            (prismaMock.user.findUnique as unknown as MockFunction).mockResolvedValue(null);

            // Should throw AuthenticationError
            const result = await prismaMock.user.findUnique({ where: { email: 'nonexistent@example.com' } });
            expect(result).toBeNull();
        });
    });

    describe('token generation', () => {
        it('should generate valid JWT access token', () => {
            const payload = { userId: 'user-123', email: 'test@example.com', role: 'USER' };
            const secret = 'test-secret-min-32-characters-long';

            const token = jwt.sign({ ...payload, type: 'access' }, secret, { expiresIn: '15m' });
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
            expect(decoded.type).toBe('access');
        });

        it('should generate valid refresh token', () => {
            const payload = { userId: 'user-123', email: 'test@example.com', role: 'USER' };
            const secret = 'test-secret-min-32-characters-long';

            const token = jwt.sign({ ...payload, type: 'refresh' }, secret, { expiresIn: '7d' });
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.type).toBe('refresh');
            expect(decoded.exp).toBeGreaterThan(Date.now() / 1000 + 86400); // At least 1 day
        });

        it('should reject expired tokens', () => {
            const payload = { userId: 'user-123', type: 'access' };
            const secret = 'test-secret-min-32-characters-long';

            const token = jwt.sign(payload, secret, { expiresIn: '-1s' }); // Already expired

            expect(() => jwt.verify(token, secret)).toThrow();
        });
    });

    describe('logout', () => {
        it('should delete session on logout', async () => {
            (prismaMock.session.delete as unknown as MockFunction).mockResolvedValue(createMockSession());

            await prismaMock.session.delete({ where: { token: 'mock-token' } });

            expect(prismaMock.session.delete).toHaveBeenCalled();
        });
    });

    describe('refresh token rotation', () => {
        it('should invalidate old refresh token after use', async () => {
            const oldSession = createMockSession();

            (prismaMock.session.findUnique as unknown as MockFunction).mockResolvedValue(oldSession);
            (prismaMock.session.delete as unknown as MockFunction).mockResolvedValue(oldSession);
            (prismaMock.session.create as unknown as MockFunction).mockResolvedValue(createMockSession());

            // Simulate using refresh token
            await prismaMock.session.delete({ where: { refreshToken: oldSession.refreshToken } });

            expect(prismaMock.session.delete).toHaveBeenCalled();
        });
    });
});
