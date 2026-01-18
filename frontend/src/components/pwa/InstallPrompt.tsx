import { useState, useEffect, useSyncExternalStore } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent
    }
}

// Check if running in standalone mode
function getIsStandalone() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
}

function subscribeToStandalone(callback: () => void) {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', callback)
    return () => mediaQuery.removeEventListener('change', callback)
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const isInstalled = useSyncExternalStore(subscribeToStandalone, getIsStandalone, () => false)

    useEffect(() => {
        // Skip if already installed
        if (isInstalled) return

        // Check if prompt was dismissed before
        const dismissed = localStorage.getItem('pwa_prompt_dismissed')
        if (dismissed) {
            const dismissedDate = new Date(dismissed)
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            // Show again after 7 days
            if (daysSinceDismissed < 7) return
        }

        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt after 3 seconds
            setTimeout(() => setIsVisible(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if app was installed
        const installHandler = () => {
            setIsVisible(false)
            localStorage.setItem('pwa_installed', 'true')
        }
        window.addEventListener('appinstalled', installHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('appinstalled', installHandler)
        }
    }, [isInstalled])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('PWA installed successfully')
            localStorage.setItem('pwa_installed', 'true')
        }

        setDeferredPrompt(null)
        setIsVisible(false)
    }

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString())
    }

    if (!isVisible || isInstalled) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-lg">
                                Install GATEMATE
                            </h3>
                            <p className="text-white/80 text-sm mt-1">
                                Add to home screen for quick access, offline support, and push notifications!
                            </p>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-white text-blue-600 font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Install
                        </button>
                    </div>
                </div>

                {/* Benefits bar */}
                <div className="bg-black/20 px-4 py-2.5 flex items-center justify-center gap-4 text-xs text-white/80">
                    <span>✓ Works offline</span>
                    <span>✓ Fast access</span>
                    <span>✓ Push alerts</span>
                </div>
            </div>
        </div>
    )
}
