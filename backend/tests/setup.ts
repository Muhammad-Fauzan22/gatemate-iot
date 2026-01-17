// =============================================================================
// GATEMATE Backend - Test Setup
// =============================================================================

import { jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// =============================================================================
// Mock Prisma Client
// =============================================================================

export const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

beforeEach(() => {
    mockReset(prismaMock);
});

// =============================================================================
// Environment Variables for Testing
// =============================================================================

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/gatemate_test';

// =============================================================================
// Global Test Utilities
// =============================================================================

export const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    name: 'Test User',
    avatar: null,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
});

export const createMockDevice = (overrides = {}) => ({
    id: 'device-123',
    deviceId: 'GATEMATE-001',
    name: 'Test Gate',
    type: 'GATE',
    firmwareVersion: '2.0.4',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    ipAddress: '192.168.1.100',
    isOnline: true,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    config: {},
    ...overrides,
});

export const createMockSession = (overrides = {}) => ({
    id: 'session-123',
    userId: 'user-123',
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
    userAgent: 'Test Agent',
    ipAddress: '127.0.0.1',
    ...overrides,
});

// =============================================================================
// Console Suppression (optional, for cleaner test output)
// =============================================================================

// Uncomment to suppress console output during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
