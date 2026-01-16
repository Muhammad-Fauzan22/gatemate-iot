// =============================================================================
// GATEMATE Frontend - API Client Service
// =============================================================================

import { config } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

class ApiClient {
    private baseUrl = config.API_URL;

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = useAuthStore.getState().token;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired, logout
            useAuthStore.getState().logout();
            throw new Error('Session expired');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || 'Request failed');
        }

        return response.json();
    }

    // Auth endpoints
    async login(email: string, password: string) {
        return this.request<{ user: any; accessToken: string; refreshToken: string }>(
            '/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password }) }
        );
    }

    async register(email: string, password: string, name: string) {
        return this.request<{ user: any; accessToken: string }>(
            '/auth/register',
            { method: 'POST', body: JSON.stringify({ email, password, name }) }
        );
    }

    async getProfile() {
        return this.request<any>('/auth/me');
    }

    // Device endpoints
    async getDevices() {
        return this.request<any[]>('/devices');
    }

    async getDevice(id: string) {
        return this.request<any>(`/devices/${id}`);
    }

    async getDeviceStatus(id: string) {
        return this.request<any>(`/devices/${id}/status`);
    }

    // Command endpoints
    async openGate(deviceId: string) {
        return this.request<any>(`/commands/${deviceId}/open`, { method: 'POST' });
    }

    async closeGate(deviceId: string) {
        return this.request<any>(`/commands/${deviceId}/close`, { method: 'POST' });
    }

    async stopGate(deviceId: string) {
        return this.request<any>(`/commands/${deviceId}/stop`, { method: 'POST' });
    }

    async setGatePercentage(deviceId: string, percentage: number) {
        return this.request<any>(`/commands/${deviceId}/partial`, {
            method: 'POST',
            body: JSON.stringify({ percentage }),
        });
    }

    async getCommandHistory(deviceId: string, limit = 20) {
        return this.request<any[]>(`/commands/${deviceId}/history?limit=${limit}`);
    }

    // Schedule endpoints
    async getSchedules() {
        return this.request<any[]>('/schedules');
    }

    async createSchedule(data: any) {
        return this.request<any>('/schedules', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSchedule(id: string, data: any) {
        return this.request<any>(`/schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteSchedule(id: string) {
        return this.request<any>(`/schedules/${id}`, { method: 'DELETE' });
    }

    async toggleSchedule(id: string) {
        return this.request<any>(`/schedules/${id}/toggle`, { method: 'PATCH' });
    }
}

export const api = new ApiClient();
