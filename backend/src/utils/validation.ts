// =============================================================================
// GATEMATE Backend - Input Validation Schemas (Zod)
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Auth Schemas
// =============================================================================

export const registerSchema = z.object({
    email: z.string()
        .email('Email tidak valid')
        .min(5, 'Email minimal 5 karakter')
        .max(100, 'Email maksimal 100 karakter')
        .transform(val => val.toLowerCase().trim()),

    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .max(100, 'Password maksimal 100 karakter')
        .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
        .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
        .regex(/[0-9]/, 'Password harus mengandung angka'),

    name: z.string()
        .min(2, 'Nama minimal 2 karakter')
        .max(50, 'Nama maksimal 50 karakter')
        .trim(),
});

export const loginSchema = z.object({
    email: z.string()
        .email('Email tidak valid')
        .transform(val => val.toLowerCase().trim()),

    password: z.string()
        .min(1, 'Password tidak boleh kosong'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token tidak boleh kosong'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Password saat ini tidak boleh kosong'),

    newPassword: z.string()
        .min(8, 'Password baru minimal 8 karakter')
        .max(100, 'Password maksimal 100 karakter')
        .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
        .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
        .regex(/[0-9]/, 'Password harus mengandung angka'),
});

export const updateProfileSchema = z.object({
    name: z.string()
        .min(2, 'Nama minimal 2 karakter')
        .max(50, 'Nama maksimal 50 karakter')
        .trim()
        .optional(),

    avatar: z.string()
        .url('URL avatar tidak valid')
        .optional(),
});

// =============================================================================
// Device Schemas
// =============================================================================

export const createDeviceSchema = z.object({
    name: z.string()
        .min(2, 'Nama perangkat minimal 2 karakter')
        .max(50, 'Nama perangkat maksimal 50 karakter')
        .trim(),

    type: z.enum(['gate', 'garage', 'door'], {
        errorMap: () => ({ message: 'Tipe harus gate, garage, atau door' }),
    }),

    ip: z.string()
        .ip({ version: 'v4', message: 'IP address tidak valid' })
        .optional(),

    macAddress: z.string()
        .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC address tidak valid')
        .optional(),
});

export const updateDeviceSchema = z.object({
    name: z.string()
        .min(2, 'Nama perangkat minimal 2 karakter')
        .max(50, 'Nama perangkat maksimal 50 karakter')
        .trim()
        .optional(),

    status: z.enum(['online', 'offline']).optional(),

    ip: z.string()
        .ip({ version: 'v4', message: 'IP address tidak valid' })
        .optional(),
});

export const deviceCommandSchema = z.object({
    command: z.enum(['open', 'close', 'stop', 'toggle'], {
        errorMap: () => ({ message: 'Command harus open, close, stop, atau toggle' }),
    }),

    duration: z.number()
        .int('Durasi harus bilangan bulat')
        .min(0, 'Durasi tidak boleh negatif')
        .max(60000, 'Durasi maksimal 60 detik')
        .optional(),
});

// =============================================================================
// Schedule Schemas
// =============================================================================

export const createScheduleSchema = z.object({
    name: z.string()
        .min(2, 'Nama jadwal minimal 2 karakter')
        .max(50, 'Nama jadwal maksimal 50 karakter')
        .trim(),

    deviceId: z.string()
        .uuid('Device ID tidak valid'),

    action: z.enum(['open', 'close'], {
        errorMap: () => ({ message: 'Action harus open atau close' }),
    }),

    time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu harus HH:MM'),

    days: z.array(z.number().int().min(0).max(6))
        .min(1, 'Pilih minimal satu hari')
        .max(7, 'Maksimal 7 hari'),

    enabled: z.boolean().default(true),

    repeat: z.enum(['once', 'daily', 'weekly', 'custom']).default('weekly'),
});

export const updateScheduleSchema = z.object({
    name: z.string()
        .min(2, 'Nama jadwal minimal 2 karakter')
        .max(50, 'Nama jadwal maksimal 50 karakter')
        .trim()
        .optional(),

    action: z.enum(['open', 'close']).optional(),

    time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu harus HH:MM')
        .optional(),

    days: z.array(z.number().int().min(0).max(6))
        .min(1, 'Pilih minimal satu hari')
        .max(7, 'Maksimal 7 hari')
        .optional(),

    enabled: z.boolean().optional(),
});

// =============================================================================
// Guest Access Schema
// =============================================================================

export const guestAccessSchema = z.object({
    deviceId: z.string()
        .uuid('Device ID tidak valid'),

    name: z.string()
        .min(2, 'Nama tamu minimal 2 karakter')
        .max(50, 'Nama tamu maksimal 50 karakter')
        .trim(),

    expiresAt: z.string()
        .datetime('Format tanggal tidak valid')
        .optional(),

    maxUses: z.number()
        .int('Maksimal penggunaan harus bilangan bulat')
        .min(1, 'Minimal 1 kali penggunaan')
        .max(100, 'Maksimal 100 kali penggunaan')
        .default(1),

    permissions: z.array(z.enum(['open', 'close', 'view']))
        .min(1, 'Pilih minimal satu permission')
        .default(['open']),
});

// =============================================================================
// Pagination Schema
// =============================================================================

export const paginationSchema = z.object({
    page: z.string()
        .transform(val => parseInt(val, 10))
        .pipe(z.number().int().min(1).default(1))
        .optional(),

    limit: z.string()
        .transform(val => parseInt(val, 10))
        .pipe(z.number().int().min(1).max(100).default(20))
        .optional(),

    sortBy: z.string()
        .max(50)
        .optional(),

    sortOrder: z.enum(['asc', 'desc'])
        .default('desc')
        .optional(),
});

// =============================================================================
// ID Parameter Schema
// =============================================================================

export const idParamSchema = z.object({
    id: z.string()
        .uuid('ID tidak valid'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeviceCommandInput = z.infer<typeof deviceCommandSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type GuestAccessInput = z.infer<typeof guestAccessSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
