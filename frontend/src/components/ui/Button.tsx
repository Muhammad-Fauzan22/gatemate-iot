import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-xl
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `

        const variants = {
            primary: `
        bg-primary hover:bg-primary-hover text-white
        shadow-glow focus:ring-primary/50
      `,
            secondary: `
        bg-gray-100 dark:bg-surface-highlight hover:bg-gray-200 dark:hover:bg-white/10
        text-gray-900 dark:text-white
        focus:ring-gray-300
      `,
            outline: `
        border border-border-light dark:border-border-dark
        bg-transparent hover:bg-gray-50 dark:hover:bg-white/5
        text-gray-700 dark:text-gray-200
        focus:ring-primary/50
      `,
            ghost: `
        bg-transparent hover:bg-gray-100 dark:hover:bg-white/10
        text-gray-700 dark:text-gray-200
        focus:ring-gray-300
      `,
            danger: `
        bg-danger hover:bg-red-600 text-white
        focus:ring-danger/50
      `,
        }

        const sizes = {
            sm: 'px-3 py-2 text-sm gap-1.5',
            md: 'px-4 py-3 text-base gap-2',
            lg: 'px-6 py-4 text-lg gap-2.5',
        }

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
                aria-busy={isLoading}
                {...props}
            >
                {isLoading ? (
                    <span
                        className="material-symbols-outlined animate-spin text-current"
                        aria-hidden="true"
                    >
                        progress_activity
                    </span>
                ) : (
                    <>
                        {leftIcon && (
                            <span aria-hidden="true">{leftIcon}</span>
                        )}
                        {children}
                        {rightIcon && (
                            <span aria-hidden="true">{rightIcon}</span>
                        )}
                    </>
                )}
            </button>
        )
    }
)

Button.displayName = 'Button'

export default Button
