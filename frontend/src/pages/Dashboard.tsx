import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useGateStore } from '@/stores/gateStore'
import { useToast } from '@/components/ui'

const activityLogs = [
    { id: 1, icon: 'lock', title: 'Gate Closed', time: '08:30 AM', detail: 'Automated timer', color: 'text-gray-400' },
    { id: 2, icon: 'directions_car', title: 'Car Detected', time: '08:25 AM', detail: 'License Plate: ABC-123', color: 'text-primary' },
    { id: 3, icon: 'lock_open', title: 'Gate Opened', time: '08:24 AM', detail: 'Triggered by Alex', color: 'text-gray-400' },
]

export default function Dashboard() {
    const { user } = useAuthStore()
    const { gates, openGate, closeGate, stopGate } = useGateStore()
    const { showToast } = useToast()
    const mainGate = gates[0]

    const handleQuickAction = async (action: 'open' | 'close' | 'stop') => {
        if (!mainGate) return
        try {
            switch (action) {
                case 'open':
                    showToast('info', 'Opening gate...')
                    await openGate(mainGate.id)
                    showToast('success', 'Gate opened successfully!')
                    break
                case 'close':
                    showToast('info', 'Closing gate...')
                    await closeGate(mainGate.id)
                    showToast('success', 'Gate closed successfully!')
                    break
                case 'stop':
                    await stopGate(mainGate.id)
                    showToast('warning', 'Gate stopped!')
                    break
            }
        } catch {
            showToast('error', 'Action failed. Please try again.')
        }
    }

    const getStatusText = () => {
        if (!mainGate) return 'OFFLINE'
        switch (mainGate.status) {
            case 'open': return 'GATE OPEN'
            case 'closed': return 'GATE CLOSED'
            case 'opening': return 'OPENING...'
            case 'closing': return 'CLOSING...'
            case 'stopped': return 'STOPPED'
            default: return 'UNKNOWN'
        }
    }

    return (
        <>
            {/* Top App Bar */}
            <header className="flex items-center justify-between p-5 pt-8 bg-background-light dark:bg-background-dark sticky top-0 z-20 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div
                            className="size-10 rounded-full bg-cover bg-center ring-2 ring-primary/30"
                            style={{ backgroundImage: `url("${user?.avatar || ''}")` }}
                        />
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background-dark" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Welcome back,</span>
                        <h1 className="text-lg font-bold leading-none">{user?.name || 'User'}</h1>
                    </div>
                </div>
                <button className="relative p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">notifications</span>
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-col gap-6 px-5 pb-6">
                {/* Status Card */}
                <section>
                    <Link to={`/gate/${mainGate?.id || '1'}`}>
                        <div className="relative overflow-hidden rounded-2xl bg-surface-dark border border-white/5 shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-symbols-outlined text-[120px] leading-none text-white">fence</span>
                            </div>
                            <div className="relative z-10 p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">System Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${mainGate?.status === 'open' ? 'bg-primary' :
                                                mainGate?.status === 'closed' ? 'bg-gray-500' :
                                                    'bg-warning animate-pulse'
                                                }`} />
                                            <h2 className="text-2xl font-bold text-gray-200">{getStatusText()}</h2>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <span className="text-xs font-medium text-gray-400">
                                            {mainGate?.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-white/10" />
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="material-symbols-outlined text-lg">schedule</span>
                                    <p>Last activity: Today, 08:30 AM</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Live Camera Feed */}
                <section className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Live View</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded text-red-500">
                            <span className="block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-wider">LIVE</span>
                        </div>
                    </div>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group shadow-lg">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                            style={{
                                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAeib85wg84GyAIXbrwqcKxoazAJUtcW5UK33ULIHpa-zFnhETe-9AM3KwsxiCAROSvwqThL5bqEKZhmkWJSR-SdWmlg7Jit8b9XcmakNV-NilMPrV-y6m832C4iyWDyCoVcLgYTuN5FMorVMFPtrW-6w74LwzI2EPjAAknx_2m4dBhdsC2XwGVKVWD4aQx5hYLWjYTkyXX0kvZssiUJqszNP-4YGbJPUJb5Pot08xOJlgtMuRA19dmgpEwRWW_L27KkYylDze_2B5O")'
                            }}
                        />
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all border border-white/20">
                                <span className="material-symbols-outlined text-white text-3xl">open_in_full</span>
                            </button>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-white/80">
                            CAM_01 • 1080p
                        </div>
                    </div>
                </section>

                {/* Sensor Chips */}
                <section className="w-full overflow-x-auto no-scrollbar pb-1">
                    <div className="flex gap-3 min-w-max">
                        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-surface-dark border border-white/5 pl-2 pr-3 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[20px]">wifi</span>
                            <p className="text-white text-xs font-semibold">Strong Signal</p>
                        </div>
                        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-surface-dark border border-white/5 pl-2 pr-3 shadow-sm">
                            <span className="material-symbols-outlined text-yellow-400 text-[20px]">bolt</span>
                            <p className="text-white text-xs font-semibold">AC Power</p>
                        </div>
                        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-surface-dark border border-white/5 pl-2 pr-3 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[20px]">battery_full</span>
                            <p className="text-white text-xs font-semibold">100%</p>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 px-1">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Open Gate */}
                        <button
                            onClick={() => handleQuickAction('open')}
                            disabled={mainGate?.status === 'opening' || mainGate?.status === 'open'}
                            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_20px_-5px_rgba(75,190,79,0.4)] disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-3xl text-white">lock_open</span>
                            <span className="text-xs font-bold text-white">Open Gate</span>
                        </button>
                        {/* Close Gate */}
                        <button
                            onClick={() => handleQuickAction('close')}
                            disabled={mainGate?.status === 'closing' || mainGate?.status === 'closed'}
                            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-surface-dark border border-danger/30 hover:bg-danger/10 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-3xl text-danger">lock</span>
                            <span className="text-xs font-bold text-danger">Close Gate</span>
                        </button>
                        {/* Emergency */}
                        <button
                            onClick={() => handleQuickAction('stop')}
                            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-surface-dark border border-warning/30 hover:bg-warning/10 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl text-warning">e911_emergency</span>
                            <span className="text-xs font-bold text-warning">Emergency</span>
                        </button>
                        {/* Schedule */}
                        <Link
                            to="/schedule"
                            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-surface-dark hover:bg-white/5 active:scale-95 transition-all border border-white/5"
                        >
                            <span className="material-symbols-outlined text-3xl text-gray-400">calendar_clock</span>
                            <span className="text-xs font-medium text-gray-400">Schedule</span>
                        </Link>
                        {/* Guest */}
                        <button className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-surface-dark hover:bg-white/5 active:scale-95 transition-all border border-white/5">
                            <span className="material-symbols-outlined text-3xl text-gray-400">person_add</span>
                            <span className="text-xs font-medium text-gray-400">Guest</span>
                        </button>
                        {/* Settings */}
                        <Link
                            to="/settings"
                            className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl bg-surface-dark hover:bg-white/5 active:scale-95 transition-all border border-white/5"
                        >
                            <span className="material-symbols-outlined text-3xl text-gray-400">tune</span>
                            <span className="text-xs font-medium text-gray-400">Settings</span>
                        </Link>
                    </div>
                </section>

                {/* Recent Activity Timeline */}
                <section>
                    <div className="flex justify-between items-baseline mb-3 px-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Logs</h3>
                        <button className="text-xs font-medium text-primary hover:text-primary/80">View all</button>
                    </div>
                    <div className="flex flex-col gap-4 pl-2 relative">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[21px] top-2 bottom-2 w-px bg-white/10 z-0" />
                        {activityLogs.map((log) => (
                            <div key={log.id} className="flex gap-4 relative z-10">
                                <div className={`flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-surface-dark border border-white/10 ${log.color}`}>
                                    <span className="material-symbols-outlined text-[20px]">{log.icon}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-semibold text-white">{log.title}</p>
                                        <span className="text-xs text-gray-500 font-mono">{log.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{log.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    )
}
