// =============================================================================
// GATEMATE Backend - Test Setup
// =============================================================================

import { beforeAll, afterAll, vi } from 'vitest';

// Set timezone for consistent date testing
process.env.TZ = 'Asia/Jakarta';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '24h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Mock console for cleaner test output
beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'info').mockImplementation(() => { });
    vi.spyOn(console, 'debug').mockImplementation(() => { });
});

afterAll(() => {
    vi.restoreAllMocks();
});
