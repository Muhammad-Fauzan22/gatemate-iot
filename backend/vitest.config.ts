// =============================================================================
// GATEMATE Backend - Vitest Configuration
// =============================================================================

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules',
                'dist',
                'tests',
                '**/*.d.ts',
                '**/*.config.*',
            ],
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 50,
                statements: 50,
            },
        },
        reporters: ['verbose'],
        testTimeout: 10000,
        hookTimeout: 10000,
        setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
