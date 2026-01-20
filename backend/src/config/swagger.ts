// =============================================================================
// GATEMATE Backend - Swagger/OpenAPI Documentation
// =============================================================================

import swaggerJsdoc from 'swagger-jsdoc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: any = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GATEMATE IoT API',
            version: '2.0.1',
            description: `
# GATEMATE IoT Gate Control System API

Sistem kontrol gerbang IoT yang memungkinkan pengguna mengontrol gerbang rumah mereka 
secara remote melalui aplikasi mobile dan web.

## Fitur Utama
- 🔐 **Autentikasi** - JWT dengan refresh token
- 🚪 **Kontrol Gerbang** - Buka/tutup secara real-time
- ⏰ **Penjadwalan** - Otomatisasi buka/tutup
- 👥 **Akses Tamu** - QR code untuk akses sementara
- 📊 **Monitoring** - Status perangkat real-time
- 📝 **Logging** - Riwayat aktivitas lengkap

## Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Auth | 5 requests / 15 menit |
| API | 100 requests / menit |
| Commands | 30 requests / menit |

## Error Codes
| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Input tidak valid |
| AUTHENTICATION_ERROR | Token tidak valid/expired |
| AUTHORIZATION_ERROR | Akses ditolak |
| NOT_FOUND | Resource tidak ditemukan |
| RATE_LIMIT_EXCEEDED | Terlalu banyak request |
            `,
            contact: {
                name: 'GATEMATE Support',
                email: 'support@gatemate.io',
                url: 'https://gatemate.io',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development Server',
            },
            {
                url: 'https://api.gatemate.io/api/v1',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from login',
                },
            },
            schemas: {
                // Common Schemas
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Email tidak valid' },
                                details: { type: 'array', items: { type: 'object' } },
                            },
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        path: { type: 'string' },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 50 },
                        totalPages: { type: 'integer', example: 3 },
                    },
                },

                // Auth Schemas
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        password: { type: 'string', minLength: 8, example: 'Password123' },
                        name: { type: 'string', example: 'John Doe' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        password: { type: 'string', example: 'Password123' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Login berhasil' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                                expiresIn: { type: 'string', example: '24h' },
                            },
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        avatar: { type: 'string', format: 'uri', nullable: true },
                        role: { type: 'string', enum: ['user', 'admin'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                },

                // Device Schemas
                Device: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Gerbang Utama' },
                        type: { type: 'string', enum: ['gate', 'garage', 'door'] },
                        status: { type: 'string', enum: ['online', 'offline'] },
                        ip: { type: 'string', format: 'ipv4', nullable: true },
                        macAddress: { type: 'string', nullable: true },
                        firmwareVersion: { type: 'string', nullable: true },
                        lastSeen: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreateDeviceRequest: {
                    type: 'object',
                    required: ['name', 'type'],
                    properties: {
                        name: { type: 'string', example: 'Gerbang Utama' },
                        type: { type: 'string', enum: ['gate', 'garage', 'door'] },
                        ip: { type: 'string', format: 'ipv4' },
                        macAddress: { type: 'string', pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
                    },
                },
                DeviceCommand: {
                    type: 'object',
                    required: ['command'],
                    properties: {
                        command: { type: 'string', enum: ['open', 'close', 'stop', 'toggle'] },
                        duration: { type: 'integer', minimum: 0, maximum: 60000 },
                    },
                },

                // Schedule Schemas
                Schedule: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Buka Pagi' },
                        deviceId: { type: 'string', format: 'uuid' },
                        action: { type: 'string', enum: ['open', 'close'] },
                        time: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$', example: '07:00' },
                        days: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 } },
                        enabled: { type: 'boolean' },
                        repeat: { type: 'string', enum: ['once', 'daily', 'weekly', 'custom'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreateScheduleRequest: {
                    type: 'object',
                    required: ['name', 'deviceId', 'action', 'time', 'days'],
                    properties: {
                        name: { type: 'string', example: 'Buka Pagi' },
                        deviceId: { type: 'string', format: 'uuid' },
                        action: { type: 'string', enum: ['open', 'close'] },
                        time: { type: 'string', example: '07:00' },
                        days: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3, 4, 5] },
                        enabled: { type: 'boolean', default: true },
                        repeat: { type: 'string', enum: ['once', 'daily', 'weekly', 'custom'], default: 'weekly' },
                    },
                },

                // Activity Log Schema
                ActivityLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        action: { type: 'string', example: 'open' },
                        details: { type: 'string', nullable: true },
                        source: { type: 'string', enum: ['app', 'schedule', 'guest', 'manual'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        user: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                            },
                        },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Token tidak valid atau tidak disertakan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource tidak ditemukan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                ValidationError: {
                    description: 'Data input tidak valid',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                RateLimited: {
                    description: 'Terlalu banyak request',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Autentikasi pengguna' },
            { name: 'Devices', description: 'Manajemen perangkat' },
            { name: 'Commands', description: 'Kontrol gerbang' },
            { name: 'Schedules', description: 'Penjadwalan otomatis' },
            { name: 'Guest', description: 'Akses tamu' },
            { name: 'Users', description: 'Manajemen pengguna' },
            { name: 'Diagnostics', description: 'Diagnostik perangkat' },
        ],
        security: [{ BearerAuth: [] }],
    },
    apis: [
        './src/modules/**/*.routes.ts',
        './src/modules/**/*.routes.js',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
export const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2563eb }
    `,
    customSiteTitle: 'GATEMATE API Documentation',
    customfavIcon: '/favicon.ico',
};
