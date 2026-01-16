// =============================================================================
// GATEMATE Frontend - API Hook with Error Handling
// =============================================================================

import { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface ApiError {
    success: false;
    error: string;
    code: string;
    errors?: Record<string, string[]>;
}

interface ApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: string, code: string) => void;
    showToast?: boolean;
    retryCount?: number;
}

// =============================================================================
// Toast Notification (simple implementation)
// =============================================================================

const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white z-50 
                     ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}
                     animate-fade-in-up`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// =============================================================================
// API Hook
// =============================================================================

export function useApi<T = unknown>() {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (
        apiCall: () => Promise<Response>,
        options: ApiOptions<T> = {}
    ): Promise<{ data: T | null; error: string | null }> => {
        const { onSuccess, onError, showToast: shouldShowToast = true, retryCount = 0 } = options;

        setState(prev => ({ ...prev, loading: true, error: null }));

        let lastError = '';

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                const response = await apiCall();

                // Handle non-OK responses
                if (!response.ok) {
                    const errorData = await response.json() as ApiError;
                    throw new Error(errorData.error || `Request failed with status ${response.status}`);
                }

                const data = await response.json() as T;

                setState({ data, loading: false, error: null });
                onSuccess?.(data);

                return { data, error: null };

            } catch (err) {
                lastError = err instanceof Error ? err.message : 'An unexpected error occurred';

                // If not last attempt, wait and retry
                if (attempt < retryCount) {
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    continue;
                }
            }
        }

        // All attempts failed
        setState(prev => ({ ...prev, loading: false, error: lastError }));

        if (shouldShowToast) {
            showToast(lastError, 'error');
        }

        onError?.(lastError, 'API_ERROR');

        return { data: null, error: lastError };
    }, []);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
        showToast,
    };
}

// =============================================================================
// Mutation Hook (for POST/PUT/DELETE)
// =============================================================================

export function useMutation<TData = unknown, TVariables = unknown>() {
    const [state, setState] = useState<{
        loading: boolean;
        error: string | null;
    }>({
        loading: false,
        error: null,
    });

    const mutate = useCallback(async (
        mutationFn: (variables: TVariables) => Promise<Response>,
        variables: TVariables,
        options: ApiOptions<TData> = {}
    ): Promise<{ data: TData | null; error: string | null }> => {
        const { onSuccess, onError, showToast: shouldShowToast = true } = options;

        setState({ loading: true, error: null });

        try {
            const response = await mutationFn(variables);

            if (!response.ok) {
                const errorData = await response.json() as ApiError;

                // Format validation errors
                let errorMessage = errorData.error;
                if (errorData.errors) {
                    const validationErrors = Object.entries(errorData.errors)
                        .flatMap(([field, msgs]) => msgs.map(m => `${field}: ${m}`))
                        .join(', ');
                    errorMessage = validationErrors || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json() as TData;

            setState({ loading: false, error: null });
            onSuccess?.(data);

            if (shouldShowToast) {
                showToast('Success!', 'success');
            }

            return { data, error: null };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

            setState({ loading: false, error: errorMessage });

            if (shouldShowToast) {
                showToast(errorMessage, 'error');
            }

            onError?.(errorMessage, 'MUTATION_ERROR');

            return { data: null, error: errorMessage };
        }
    }, []);

    return {
        ...state,
        mutate,
    };
}

// =============================================================================
// Offline Queue
// =============================================================================

interface QueuedAction {
    id: string;
    url: string;
    method: string;
    body?: object;
    timestamp: number;
}

class OfflineQueue {
    private queue: QueuedAction[] = [];
    private readonly STORAGE_KEY = 'gatemate_offline_queue';

    constructor() {
        this.loadFromStorage();

        // Process queue when coming online
        window.addEventListener('online', () => this.processQueue());
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.queue = stored ? JSON.parse(stored) : [];
        } catch {
            this.queue = [];
        }
    }

    private saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    }

    add(url: string, method: string, body?: object) {
        const action: QueuedAction = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            method,
            body,
            timestamp: Date.now(),
        };

        this.queue.push(action);
        this.saveToStorage();

        showToast('Action queued - will sync when online', 'info');

        return action.id;
    }

    async processQueue() {
        if (!navigator.onLine || this.queue.length === 0) return;

        const toProcess = [...this.queue];
        this.queue = [];
        this.saveToStorage();

        for (const action of toProcess) {
            try {
                const response = await fetch(action.url, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        // Add auth token
                    },
                    body: action.body ? JSON.stringify(action.body) : undefined,
                });

                if (!response.ok) {
                    throw new Error('Request failed');
                }

                console.log(`[OfflineQueue] Synced: ${action.id}`);
            } catch (error) {
                // Re-add failed actions
                this.queue.push(action);
                this.saveToStorage();
                console.error(`[OfflineQueue] Failed: ${action.id}`, error);
            }
        }

        if (this.queue.length === 0) {
            showToast('All actions synced!', 'success');
        }
    }

    getQueueLength() {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
        this.saveToStorage();
    }
}

export const offlineQueue = new OfflineQueue();

// =============================================================================
// Network Status Hook
// =============================================================================

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingActions, setPendingActions] = useState(offlineQueue.getQueueLength());

    useState(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    });

    return { isOnline, pendingActions };
}
