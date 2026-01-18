import { type HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
    animation?: 'pulse' | 'wave' | 'none'
}

export default function Skeleton({
    variant = 'text',
    width,
    height,
    animation = 'pulse',
    className = '',
    ...props
}: SkeletonProps) {
    const variants = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    }

    const animations = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
    }

    const defaultHeight = variant === 'text' ? 'h-4' : ''
    const defaultWidth = variant === 'circular' ? 'aspect-square' : 'w-full'

    return (
        <div
            className={`
        bg-gray-200 dark:bg-gray-700
        ${variants[variant]}
        ${animations[animation]}
        ${!height ? defaultHeight : ''}
        ${!width ? defaultWidth : ''}
        ${className}
      `}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
            aria-hidden="true"
            {...props}
        />
    )
}

// Skeleton presets
export function SkeletonCard() {
    return (
        <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                </div>
            </div>
            <Skeleton height={100} />
        </div>
    )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="circular" width={36} height={36} />
                    <div className="flex-1 space-y-2">
                        <Skeleton width="75%" />
                        <Skeleton width="50%" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton width={200} height={32} />
                <Skeleton variant="circular" width={40} height={40} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                        <Skeleton width="40%" className="mb-2" />
                        <Skeleton width="60%" height={28} />
                    </div>
                ))}
            </div>

            {/* Main content */}
            <SkeletonCard />
        </div>
    )
}
