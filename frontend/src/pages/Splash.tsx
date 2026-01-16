import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function Splash() {
    const [progress, setProgress] = useState(0)
    const navigate = useNavigate()
    const { isAuthenticated, isLoading } = useAuthStore()

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    return 100
                }
                return prev + Math.random() * 15
            })
        }, 200)

        // Redirect when loading complete
        const timeout = setTimeout(() => {
            if (!isLoading) {
                navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true })
            }
        }, 2500)

        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [isAuthenticated, isLoading, navigate])

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-between bg-gradient-to-b from-background-dark to-[#1c2b1d] overflow-hidden">
            {/* Abstract Background Pattern */}
            <div
                className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#4bbe4f 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Spacer for top balance */}
            <div className="flex-1" />

            {/* Central Content Area */}
            <div className="z-10 flex flex-col items-center justify-center w-full px-6">
                {/* Logo Section with Glow */}
                <div className="relative flex items-center justify-center mb-8">
                    {/* Outer Glow */}
                    <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-glow" />

                    {/* Icon Circle */}
                    <div className="relative flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-b from-[#2a3f2d] to-[#1a261c] border border-primary/30 shadow-[0_0_30px_-5px_rgba(75,190,79,0.3)]">
                        <span
                            className="material-symbols-outlined text-primary"
                            style={{ fontSize: '64px' }}
                        >
                            security
                        </span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2">
                    <h1 className="text-white tracking-tight text-[40px] font-extrabold leading-none">
                        GATEMATE
                    </h1>
                    <p className="text-slate-400 text-base font-medium tracking-wide">
                        Smart Gate Control System
                    </p>
                </div>
            </div>

            {/* Spacer for bottom balance */}
            <div className="flex-1" />

            {/* Footer / Loader Section */}
            <div className="z-10 w-full max-w-xs px-8 pb-12 flex flex-col items-center gap-4">
                {/* Progress Bar */}
                <div className="w-full flex flex-col gap-2">
                    <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between w-full px-1">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                            Loading System
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {Math.round(Math.min(progress, 100))}%
                        </span>
                    </div>
                </div>

                {/* Version Info */}
                <div className="mt-4">
                    <p className="text-slate-600 text-xs font-mono">v1.0.0</p>
                </div>
            </div>
        </div>
    )
}
