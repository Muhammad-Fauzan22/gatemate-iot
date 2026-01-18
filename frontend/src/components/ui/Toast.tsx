import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import Icon from './Icon'

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextValue {
    toasts: Toast[]
    showToast: (type: ToastType, message: string, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast: Toast = { id, type, message, duration }

        setToasts(prev => [...prev, newToast])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

// Toast Container
function ToastContainer({
    toasts,
    removeToast
}: {
    toasts: Toast[]
    removeToast: (id: string) => void
}) {
    if (toasts.length === 0) return null

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    )
}

// Individual Toast
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const styles = {
        success: {
            bg: 'bg-success/10 dark:bg-success/20',
            border: 'border-success/30',
            icon: 'check_circle',
            iconColor: 'text-success',
        },
        error: {
            bg: 'bg-danger/10 dark:bg-danger/20',
            border: 'border-danger/30',
            icon: 'error',
            iconColor: 'text-danger',
        },
        warning: {
            bg: 'bg-warning/10 dark:bg-warning/20',
            border: 'border-warning/30',
            icon: 'warning',
            iconColor: 'text-warning',
        },
        info: {
            bg: 'bg-info/10 dark:bg-info/20',
            border: 'border-info/30',
            icon: 'info',
            iconColor: 'text-info',
        },
    }

    const style = styles[toast.type]

    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-xl border
        ${style.bg} ${style.border}
        shadow-soft animate-in slide-in-from-right-full
      `}
            role="alert"
        >
            <Icon name={style.icon} className={style.iconColor} />
            <p className="flex-1 text-sm text-gray-900 dark:text-white">
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Close notification"
            >
                <Icon name="close" size="sm" />
            </button>
        </div>
    )
}

export default ToastProvider
