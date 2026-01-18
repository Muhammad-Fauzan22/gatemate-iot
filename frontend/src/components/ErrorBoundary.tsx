import { Component, type ReactNode, type ErrorInfo } from 'react'
import Button from './ui/Button'
import Icon from './ui/Icon'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        // Here you could send to error monitoring service
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mb-4">
                            <Icon name="error" size="xl" className="text-danger" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            We encountered an unexpected error. Please try again or contact support if the problem persists.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left p-4 bg-gray-100 dark:bg-surface-highlight rounded-lg">
                                <summary className="cursor-pointer font-medium text-sm">
                                    Error Details
                                </summary>
                                <pre className="mt-2 text-xs overflow-auto text-danger">
                                    {this.state.error.message}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                            >
                                <Icon name="home" size="sm" />
                                Go Home
                            </Button>

                            <Button
                                variant="primary"
                                onClick={this.handleReset}
                            >
                                <Icon name="refresh" size="sm" />
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
