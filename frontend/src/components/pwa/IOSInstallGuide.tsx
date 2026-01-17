import { useState, useEffect } from 'react'
import { X, Share2, Plus, ChevronRight, CheckCircle2 } from 'lucide-react'

const steps = [
    {
        id: 1,
        title: 'Tap Share Button',
        description: 'Find the share icon at the bottom of Safari',
        icon: Share2
    },
    {
        id: 2,
        title: 'Scroll Down',
        description: 'Look for "Add to Home Screen" option',
        icon: ChevronRight
    },
    {
        id: 3,
        title: 'Add to Home Screen',
        description: 'Tap "Add" to install the app',
        icon: Plus
    },
    {
        id: 4,
        title: 'Done!',
        description: 'GATEMATE is now on your home screen',
        icon: CheckCircle2
    }
]

export default function IOSInstallGuide() {
    const [isVisible, setIsVisible] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        // Only show on iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches

        if (!isIOS || !isSafari || isStandalone) return

        // Check if user has seen this guide recently
        const lastSeen = localStorage.getItem('ios_guide_last_seen')
        if (lastSeen) {
            const daysSince = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSince < 14) return // Don't show for 2 weeks
        }

        // Show after 5 seconds
        const timer = setTimeout(() => setIsVisible(true), 5000)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        localStorage.setItem('ios_guide_last_seen', new Date().toISOString())
    }

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleClose()
        }
    }

    if (!isVisible) return null

    const CurrentIcon = steps[currentStep].icon

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#1a1a2e] rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">G</span>
                        </div>
                        <span className="text-white font-semibold">Install GATEMATE</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-blue-500 w-6'
                                    : index < currentStep
                                        ? 'bg-green-500'
                                        : 'bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${currentStep === steps.length - 1
                                ? 'bg-green-500/20'
                                : 'bg-blue-500/20'
                            }`}>
                            <CurrentIcon className={`w-10 h-10 ${currentStep === steps.length - 1
                                    ? 'text-green-400'
                                    : 'text-blue-400'
                                }`} />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">
                            Step {currentStep + 1}: {steps[currentStep].title}
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {steps[currentStep].description}
                        </p>

                        {/* Visual hint for step 1 */}
                        {currentStep === 0 && (
                            <div className="w-full bg-black/30 rounded-xl p-4 mb-4 flex items-center justify-center">
                                <div className="flex items-center gap-4 text-white/60">
                                    <span className="text-2xl">←</span>
                                    <div className="w-10 h-10 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                                        <Share2 className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-2xl">→</span>
                                </div>
                            </div>
                        )}

                        {/* Benefits reminder */}
                        {currentStep === steps.length - 1 && (
                            <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-4">
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div className="text-white/80">
                                        <span className="text-green-400">✓</span> Offline
                                    </div>
                                    <div className="text-white/80">
                                        <span className="text-green-400">✓</span> Fast
                                    </div>
                                    <div className="text-white/80">
                                        <span className="text-green-400">✓</span> Permanent
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            {currentStep === steps.length - 1 ? 'Got It!' : 'Next'}
                        </button>
                    </div>
                </div>

                {/* Safari hint arrow pointing down */}
                {currentStep === 0 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 animate-bounce" />
                    </div>
                )}
            </div>
        </div>
    )
}
