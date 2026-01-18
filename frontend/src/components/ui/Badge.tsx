import { type ReactNode, type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'md' | 'lg'
    dot?: boolean
    children?: ReactNode
}

export default function Badge({
    variant = 'default',
    size = 'md',
    dot = false,
    children,
    className = '',
    ...props
}: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
        info: 'bg-info/10 text-info',
    }

    const sizes = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-2.5 py-1',
    }

    if (dot) {
        return (
            <span
                className={`
          inline-flex items-center gap-1.5
          ${sizes[size]}
          ${variants[variant]}
          rounded-full font-medium
          ${className}
        `}
                {...props}
            >
                <span
                    className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'default' ? 'bg-gray-500' : 'bg-current'}
            animate-pulse
          `}
                    aria-hidden="true"
                />
                {children}
            </span>
        )
    }

    return (
        <span
            className={`
        inline-flex items-center justify-center
        ${sizes[size]}
        ${variants[variant]}
        rounded-full font-medium
        ${className}
      `}
            {...props}
        >
            {children}
        </span>
    )
}
