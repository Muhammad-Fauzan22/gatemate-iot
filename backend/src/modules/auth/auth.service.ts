// =============================================================================
// GATEMATE Backend - Authentication Service
// =============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config/env.js';
import { TokenPayload, RegisterInput } from '../../types/auth.types.js';

const prisma = new PrismaClient();

export class AuthService {
    async register(input: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(input.password, 12);

        const user = await prisma.user.create({
            data: {
                email: input.email,
                password: hashedPassword,
                name: input.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            user,
            ...tokens,
        };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
            },
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        const session = await prisma.session.findUnique({
            where: { refreshToken },
            include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }

        // Delete old session
        await prisma.session.delete({ where: { id: session.id } });

        // Generate new tokens
        const tokens = await this.generateTokens(
            session.user.id,
            session.user.email,
            session.user.role
        );

        return tokens;
    }

    async logout(token: string) {
        await prisma.session.deleteMany({
            where: { token },
        });
    }

    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
            },
        });

        return user;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate all sessions
        await prisma.session.deleteMany({
            where: { userId },
        });
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload: TokenPayload = { userId, email, role };

        const accessToken = jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN as string,
        } as jwt.SignOptions);

        const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN as string,
        } as jwt.SignOptions);

        // Parse expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Store session
        await prisma.session.create({
            data: {
                userId,
                token: accessToken,
                refreshToken,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: config.JWT_EXPIRES_IN,
        };
    }
}
