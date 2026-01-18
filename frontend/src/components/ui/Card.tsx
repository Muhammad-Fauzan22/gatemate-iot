import { type ReactNode, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children: ReactNode
}

export default function Card({
    variant = 'default',
    padding = 'md',
    children,
    className = '',
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-surface-light dark:bg-surface-dark',
        elevated: 'bg-surface-light dark:bg-surface-dark shadow-soft dark:shadow-none',
        bordered: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark',
    }

    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    }

    return (
        <div
            className={`
        rounded-xl
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
    return (
        <div
            className={`flex items-center justify-between mb-4 ${className}`}
            {...props}
        >
            {children}
        </div>
    )
}

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children: ReactNode
    as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, as: Component = 'h3', className = '', ...props }: CardTitleProps) {
    return (
        <Component
            className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
            {...props}
        >
            {children}
        </Component>
    )
}

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    )
}
