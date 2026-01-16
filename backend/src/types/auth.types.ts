// =============================================================================
// GATEMATE Backend - Authentication Types
// =============================================================================

import type { Request } from 'express';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}
