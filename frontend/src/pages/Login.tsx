import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const { login } = useAuthStore()
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(email, password)
            showToast('success', 'Welcome back!')
            navigate('/dashboard', { replace: true })
        } catch {
            setError('Invalid email or password')
            showToast('error', 'Login failed. Please check your credentials.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="font-display antialiased text-gray-900 dark:text-white bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-4">
            {/* Mobile Container */}
            <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl shadow-soft dark:shadow-none overflow-hidden border border-border-light dark:border-border-dark relative animate-scale-in">
                {/* Background Pattern/Decoration */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                {/* Header Section */}
                <div className="relative px-6 pt-10 pb-6 text-center">
                    <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 text-primary ring-1 ring-primary/30">
                        <span className="material-symbols-outlined text-3xl">security</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">GATEMATE</h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        Secure Industrial & Home Access
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="px-6 mb-6">
                    <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-lg">
                        <button
                            onClick={() => setIsRegister(false)}
                            className={`flex-1 py-2 text-sm font-medium text-center rounded-md transition-all ${!isRegister
                                ? 'bg-white dark:bg-background-dark shadow-sm text-primary'
                                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsRegister(true)}
                            className={`flex-1 py-2 text-sm font-medium text-center rounded-md transition-all ${isRegister
                                ? 'bg-white dark:bg-background-dark shadow-sm text-primary'
                                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Register
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                        {error}
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="px-6 space-y-4">
                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
                                <span className="material-symbols-outlined text-[20px]">mail</span>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@gatemate.com"
                                className="block w-full pl-10 pr-3 py-3 border border-border-light dark:border-border-dark rounded-xl bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full pl-10 pr-10 py-3 border border-border-light dark:border-border-dark rounded-xl bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between py-2">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-border-dark text-primary focus:ring-primary dark:bg-background-dark"
                            />
                            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                Remember me
                            </span>
                        </label>
                        <button type="button" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    {/* Primary Action */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span>{isRegister ? 'Sign Up' : 'Log In'}</span>
                                <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                            </>
                        )}
                    </button>

                    {/* Secondary Action: PIN */}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-border-light dark:border-border-dark bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-xl">dialpad</span>
                        Login with PIN
                    </button>
                </form>

                {/* Social Divider */}
                <div className="px-6 py-6">
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                            Or continue with
                        </span>
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                    </div>
                </div>

                {/* Social Buttons */}
                <div className="px-6 grid grid-cols-2 gap-4 mb-6">
                    <button className="flex items-center justify-center py-2.5 px-4 border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path d="M23.52 12.29C23.52 11.43 23.4414 10.69 23.3 10H12V14.51H18.47C18.18 15.99 17.25 17.21 15.83 18.16V21.19H19.69C21.95 19.11 23.25 16.05 23.25 12.29H23.52Z" fill="#4285F4" />
                            <path d="M12 24C15.24 24 17.96 22.92 20 21.04L16.13 18.01C15.05 18.74 13.66 19.14 12 19.14C8.87 19.14 6.22 17.03 5.27 14.19H1.28V17.28C3.26 21.22 7.33 24 12 24Z" fill="#34A853" />
                            <path d="M5.27 14.19C5.03 13.46 4.89 12.68 4.89 11.89C4.89 11.1 5.03 10.32 5.27 9.59V6.5H1.28C0.46 8.12 0 9.95 0 11.89C0 13.83 0.46 15.66 1.28 17.28L5.27 14.19Z" fill="#FBBC05" />
                            <path d="M12 4.63C13.76 4.63 15.34 5.24 16.59 6.42L19.95 3.06C17.96 1.2 15.24 0 12 0C7.33 0 3.26 2.78 1.28 6.72L5.27 9.81C6.22 6.97 8.87 4.63 12 4.63Z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Google</span>
                    </button>
                    <button className="flex items-center justify-center py-2.5 px-4 border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <svg className="h-5 w-5 mr-2 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.38-.18-1.07-.48-2.01-.48-1.04 0-1.74.31-2.06.49-1.28.69-2.28.42-3.21-.49-1.99-1.95-3.41-5.59-1.42-8.59 1.01-1.52 2.65-2.48 4.2-2.48.97 0 1.79.35 2.37.58.48.19 1.13.45 1.54.45.33 0 1.14-.38 1.94-.7.9-.36 2.14-.66 3.65.07.72.35 1.77 1.08 2.37 1.96-2.08 1.13-2.18 4.26-.05 5.27-.03.11-.05.21-.08.32-.42 1.58-1.26 3.19-2.16 4.2zm-2.88-12.79c.63-.77 1.05-1.84.94-2.91-1.01.04-2.22.68-2.95 1.55-.65.75-1.12 1.83-1.01 2.87 1.11.09 2.27-.58 3.02-1.51z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Apple</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2 bg-gray-50 dark:bg-black/20 border-t border-border-light dark:border-border-dark text-center">
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => setIsRegister(true)}
                            className="font-bold text-primary hover:text-primary-hover"
                        >
                            Sign Up
                        </button>
                    </p>
                    <div className="flex items-center justify-center gap-4 opacity-50 grayscale">
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                            <span className="text-[10px] font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                                SSL SECURED
                            </span>
                        </div>
                        <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                            <span className="text-[10px] font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                                TLS 1.3 ENCRYPTED
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
