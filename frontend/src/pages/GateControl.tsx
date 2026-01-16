import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGateStore } from '@/stores/gateStore'

const presets = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: 'Open', value: 100 },
]

export default function GateControl() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { gates, updateGateStatus, stopGate, setGatePercentage } = useGateStore()
    const gate = gates.find((g) => g.id === id) || gates[0]

    const [sliderValue, setSliderValue] = useState(gate?.percentage || 0)
    const [showObstacleWarning, setShowObstacleWarning] = useState(false)

    // Sync slider with gate percentage
    useEffect(() => {
        if (gate) {
            setSliderValue(gate.percentage)
        }
    }, [gate?.percentage])

    // Simulate obstacle detection randomly for demo
    useEffect(() => {
        const interval = setInterval(() => {
            if (gate?.status === 'opening' || gate?.status === 'closing') {
                if (Math.random() > 0.95) {
                    setShowObstacleWarning(true)
                    stopGate(gate.id)
                }
            }
        }, 500)
        return () => clearInterval(interval)
    }, [gate?.status, gate?.id, stopGate])

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(parseInt(e.target.value))
    }

    const handleSliderRelease = () => {
        if (gate) {
            setGatePercentage(gate.id, sliderValue)
        }
    }

    const handlePreset = (value: number) => {
        setSliderValue(value)
        if (gate) {
            setGatePercentage(gate.id, value)
        }
    }

    const handleStop = () => {
        if (gate) {
            stopGate(gate.id)
        }
    }

    const getStatusDisplay = () => {
        if (!gate) return { label: 'OFFLINE', color: 'text-gray-400' }
        const percentage = gate.percentage
        switch (gate.status) {
            case 'open': return { label: '100% OPEN', color: 'text-primary' }
            case 'closed': return { label: 'CLOSED', color: 'text-gray-400' }
            case 'opening': return { label: `${percentage}% OPENING`, color: 'text-warning' }
            case 'closing': return { label: `${percentage}% CLOSING`, color: 'text-warning' }
            case 'stopped': return { label: `${percentage}% STOPPED`, color: 'text-danger' }
            default: return { label: `${percentage}% OPEN`, color: 'text-primary' }
        }
    }

    const statusDisplay = getStatusDisplay()

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl">
            {/* Header */}
            <header className="flex items-center justify-between p-4 pt-6 bg-transparent z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full bg-surface-dark/50 text-white hover:bg-surface-dark transition active:scale-95"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                        {gate?.name || 'Gate Control'}
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Online • 14ms</span>
                    </div>
                </div>
                <button className="flex size-10 items-center justify-center rounded-full bg-surface-dark/50 text-white hover:bg-surface-dark transition active:scale-95">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
                {/* 3D Visualization Card */}
                <section className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-surface-dark border border-white/5 group">
                    {/* Status Overlay */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                        <span className={`text-2xl font-black tracking-tight ${statusDisplay.color}`}>
                            {statusDisplay.label}
                        </span>
                    </div>

                    {/* Live Feed / 3D Render */}
                    <div className="aspect-[4/3] w-full bg-surface-highlight relative">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
                            style={{
                                backgroundImage: 'url("https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=2574&auto=format&fit=crop")'
                            }}
                        />

                        {/* Gate Simulation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-3/4 h-1/2 border-2 border-white/10 rounded-lg bg-black/20 backdrop-blur-sm overflow-hidden flex">
                                {/* Left Post */}
                                <div className="w-4 h-full bg-stone-700 absolute left-0 z-20" />
                                {/* Right Post */}
                                <div className="w-4 h-full bg-stone-700 absolute right-0 z-20" />

                                {/* Sliding Gate Panel */}
                                <div
                                    className="h-full bg-gradient-to-r from-stone-800 to-stone-700 border-r-4 border-primary/50 absolute left-0 top-0 transition-all duration-500 ease-out shadow-[4px_0_20px_rgba(0,0,0,0.5)]"
                                    style={{ width: `${100 - (gate?.percentage || 0)}%` }}
                                >
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <span className="material-symbols-outlined text-white/20 text-4xl">grid_view</span>
                                    </div>
                                    {/* Grid pattern */}
                                    <div
                                        className="w-full h-full opacity-20"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Obstacle Warning */}
                    {showObstacleWarning && (
                        <div className="absolute top-0 inset-x-0 bg-danger/90 backdrop-blur-md p-3 flex items-start gap-3 animate-pulse border-b border-danger/50 z-30">
                            <span className="material-symbols-outlined text-white shrink-0 filled">warning</span>
                            <div className="flex-1">
                                <p className="text-white text-sm font-bold uppercase tracking-wide leading-none mb-1">Obstacle Detected</p>
                                <p className="text-white/90 text-xs leading-tight">Movement halted. Please check the gate path.</p>
                            </div>
                            <button
                                onClick={() => setShowObstacleWarning(false)}
                                className="bg-black/20 hover:bg-black/30 text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </section>

                {/* Precision Slider */}
                <section className="space-y-3 pt-2">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Opening Percentage</label>
                        <span className="text-primary font-mono font-bold text-lg">{sliderValue}%</span>
                    </div>
                    <div className="relative w-full h-12 flex items-center justify-center">
                        {/* Track Background */}
                        <div className="absolute w-full h-2 bg-surface-highlight rounded-full overflow-hidden">
                            {/* Progress Fill */}
                            <div
                                className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-100"
                                style={{ width: `${sliderValue}%` }}
                            />
                        </div>

                        {/* Range Input */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderValue}
                            onChange={handleSliderChange}
                            onMouseUp={handleSliderRelease}
                            onTouchEnd={handleSliderRelease}
                            className="absolute w-full z-10 cursor-pointer h-12"
                        />
                    </div>
                </section>

                {/* Quick Presets */}
                <section className="grid grid-cols-4 gap-3">
                    {presets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handlePreset(preset.value)}
                            className={`group flex flex-col items-center justify-center h-14 rounded-xl transition active:scale-95 ${gate?.percentage === preset.value
                                    ? 'bg-surface-dark border border-primary/30 bg-primary/10 shadow-[inset_0_0_10px_rgba(75,190,79,0.1)]'
                                    : 'bg-surface-dark border border-white/5 active:bg-surface-highlight'
                                }`}
                        >
                            <span className={`font-bold text-sm ${gate?.percentage === preset.value
                                    ? 'text-primary'
                                    : 'text-gray-400 group-hover:text-white'
                                }`}>
                                {preset.label}
                            </span>
                        </button>
                    ))}
                </section>

                {/* Manual Control / Joystick */}
                <section className="pt-4">
                    <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-3 left-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manual Override</h3>
                        </div>

                        {/* Decorative background grid */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />

                        <div className="relative size-48 mt-4 flex items-center justify-center">
                            {/* Outer Ring */}
                            <div className="absolute inset-0 rounded-full border border-white/5 bg-surface-highlight/30" />

                            {/* Directional Indicators */}
                            <span className="material-symbols-outlined absolute top-2 text-gray-500 text-sm">expand_less</span>
                            <span className="material-symbols-outlined absolute bottom-2 text-gray-500 text-sm">expand_more</span>
                            <span className="material-symbols-outlined absolute left-2 text-gray-500 text-sm">chevron_left</span>
                            <span className="material-symbols-outlined absolute right-2 text-gray-500 text-sm">chevron_right</span>

                            {/* Joystick Base */}
                            <div className="size-32 rounded-full joystick-base flex items-center justify-center shadow-2xl relative z-10">
                                {/* Joystick Stick */}
                                <div className="size-16 rounded-full joystick-stick cursor-grab active:cursor-grabbing transform translate-y-[-10px] shadow-lg flex items-center justify-center group relative overflow-hidden">
                                    {/* Stick Shine */}
                                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
                                    <span className="material-symbols-outlined text-white drop-shadow-md">pan_tool_alt</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium pb-2">Drag to fine-tune position</p>
                    </div>
                </section>
            </main>

            {/* Floating Action Button (Voice Control) */}
            <div className="absolute bottom-6 right-6 z-50">
                <button className="size-16 rounded-full bg-primary shadow-[0_8px_25px_rgba(75,190,79,0.4)] flex items-center justify-center text-white hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-300 group">
                    <span className="material-symbols-outlined text-3xl group-hover:animate-pulse">mic</span>
                    <span className="absolute inset-0 rounded-full border-2 border-primary/50 scale-125 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
                </button>
            </div>

            {/* Stop Button */}
            <div className="absolute bottom-6 left-6 z-40">
                <button
                    onClick={handleStop}
                    className="size-12 rounded-full bg-surface-dark border border-danger/30 text-danger shadow-lg flex items-center justify-center hover:bg-danger hover:text-white transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined font-bold">stop</span>
                </button>
            </div>
        </div>
    )
}
