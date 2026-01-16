// =============================================================================
// GATEMATE Backend - Jest Configuration
// =============================================================================

import type { Config } from 'jest';

const config: Config = {
    // Use ts-jest for TypeScript
    preset: 'ts-jest',

    // Test environment
    testEnvironment: 'node',

    // Root directory
    rootDir: '.',

    // Test file patterns
    testMatch: [
        '<rootDir>/tests/**/*.test.ts',
        '<rootDir>/tests/**/*.spec.ts',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],

    // Module path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // Transform configuration
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },

    // Verbose output
    verbose: true,

    // Timeout for tests
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,

    // Force exit after tests
    forceExit: true,

    // Detect open handles
    detectOpenHandles: true,
};

export default config;
