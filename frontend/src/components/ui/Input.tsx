import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            size = 'md',
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const generatedId = useId()
        const inputId = id || generatedId

        const sizes = {
            sm: 'py-2 text-sm',
            md: 'py-3 text-base',
            lg: 'py-4 text-lg',
        }

        const paddingLeft = leftIcon ? 'pl-10' : 'pl-3'
        const paddingRight = rightIcon ? 'pr-10' : 'pr-3'

        return (
            <div className="w-full space-y-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark ml-1"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div
                            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary-light dark:text-text-secondary-dark"
                            aria-hidden="true"
                        >
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={`
              block w-full ${paddingLeft} ${paddingRight} ${sizes[size]}
              border rounded-xl
              bg-gray-50 dark:bg-background-dark
              text-gray-900 dark:text-white
              placeholder-gray-400
              transition-all duration-200
              ${error
                                ? 'border-danger focus:ring-danger/50 focus:border-danger'
                                : 'border-border-light dark:border-border-dark focus:ring-primary/50 focus:border-primary'
                            }
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={
                            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
                        }
                        {...props}
                    />

                    {rightIcon && (
                        <div
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary-light dark:text-text-secondary-dark"
                        >
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="text-sm text-danger ml-1"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {hint && !error && (
                    <p
                        id={`${inputId}-hint`}
                        className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1"
                    >
                        {hint}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input
