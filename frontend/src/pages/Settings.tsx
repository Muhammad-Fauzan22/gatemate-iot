import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface SettingItem {
    id: string
    icon: string
    label: string
    value?: string | React.ReactNode
    onClick?: () => void
    toggle?: boolean
    toggleValue?: boolean
    onToggle?: () => void
}

export default function Settings() {
    const navigate = useNavigate()
    const { logout } = useAuthStore()
    const [requirePin, setRequirePin] = useState(true)
    const [autoLock, setAutoLock] = useState(true)
    const [notifications, setNotifications] = useState(true)

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    const deviceSettings: SettingItem[] = [
        { id: 'name', icon: 'perm_device_information', label: 'Device Name', value: 'Main Gate' },
        { id: 'network', icon: 'wifi', label: 'Network', value: 'Home_5G' },
        {
            id: 'firmware',
            icon: 'system_update',
            label: 'Firmware',
            value: (
                <div className="flex items-center gap-1.5 bg-green-900/30 px-2 py-0.5 rounded text-xs font-medium text-green-400 border border-green-900/50">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    v2.0.4
                </div>
            )
        },
    ]

    const accessSettings: SettingItem[] = [
        {
            id: 'users',
            icon: 'group',
            label: 'Users',
            value: (
                <div className="flex -space-x-2">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuADIGOt6f8sLGMADny8vFsisNwOffqT73nzRmPV_W0MlbUB3FvqH0YJQ6h1zQau5W_L7dHq5q6eWnHWBiFglvC9P4jo-7Ig0cALqMtxyuFERa__qFAfv2oT9z-2m7sxb4zFyRhJQFHPYwjr5Fmckzo_2yadk3nTHzRCdsPWYqZkRPE3yaixdcwh7USJWVOgFVMYl9K69MbKaCxnNOA13LkCXagpnO7Hi-KqzEoSXo5OCIuiq8pYq0BJZNumjJ9ZvScevi7JtIo55jPB"
                        alt="User 1"
                        className="inline-block size-6 rounded-full ring-2 ring-white dark:ring-[#1c261d]"
                    />
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-EfOJ4alAftQSNN1Gl63GfXVWLQ6nGvL9B6Vdm9yg-Hz7G8pJwkjBNvE6GKNiGVCu9W51a02zLNQTjWYgGCz5BAfSPSZpG8DzyZvFtBzHu28u5ww73p0DynPQ2NPiR5UpBBWMqkDlLKxshS1v4Ce-BjN5OTvGKTjXigUqSfD5Kdd1oMTH9DSG644ekxjWJbbHDl_FgB8TxF44xQympBkjw1zMw3E1VsZdxQUyfTmu4ksQxugXdpvpryO6vt9LJkhpc-L1e7nPZP9Q"
                        alt="User 2"
                        className="inline-block size-6 rounded-full ring-2 ring-white dark:ring-[#1c261d]"
                    />
                    <div className="flex items-center justify-center size-6 rounded-full ring-2 ring-white dark:ring-[#1c261d] bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        +2
                    </div>
                </div>
            )
        },
        { id: 'permissions', icon: 'admin_panel_settings', label: 'Permissions', value: 'Admin Only' },
        {
            id: 'guest',
            icon: 'qr_code_2',
            label: 'Guest Pass',
            value: (
                <span className="text-primary text-sm font-bold">Generate</span>
            )
        },
    ]

    const securitySettings: SettingItem[] = [
        {
            id: 'pin',
            icon: 'lock',
            label: 'Require PIN',
            toggle: true,
            toggleValue: requirePin,
            onToggle: () => setRequirePin(!requirePin)
        },
        {
            id: 'autolock',
            icon: 'lock_clock',
            label: 'Auto-Lock after 5 min',
            toggle: true,
            toggleValue: autoLock,
            onToggle: () => setAutoLock(!autoLock)
        },
        { id: 'audit', icon: 'history', label: 'Security Audit Log', value: 'View' },
    ]

    const notificationSettings: SettingItem[] = [
        {
            id: 'push',
            icon: 'notifications',
            label: 'Push Notifications',
            toggle: true,
            toggleValue: notifications,
            onToggle: () => setNotifications(!notifications)
        },
        { id: 'alerts', icon: 'warning', label: 'Emergency Alerts', value: 'Always On' },
        { id: 'email', icon: 'mail', label: 'Email Reports', value: 'Weekly' },
    ]

    const renderSettingItem = (item: SettingItem, isLast: boolean) => (
        <div
            key={item.id}
            className={`flex items-center gap-4 px-4 min-h-[60px] justify-between cursor-pointer group hover:bg-gray-50 dark:hover:bg-surface-highlight transition-colors ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''
                }`}
            onClick={item.onClick}
        >
            <div className="flex items-center gap-3">
                <div className="text-white flex items-center justify-center rounded-lg bg-gray-800 dark:bg-[#2c352c] shrink-0 size-9">
                    <span className="material-symbols-outlined text-[20px] text-white/90">{item.icon}</span>
                </div>
                <p className="text-gray-900 dark:text-white text-sm font-medium leading-normal flex-1">{item.label}</p>
            </div>
            <div className="flex items-center gap-2">
                {item.toggle ? (
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={item.toggleValue}
                            onChange={item.onToggle}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                    </label>
                ) : (
                    <>
                        {typeof item.value === 'string' ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{item.value}</p>
                        ) : (
                            item.value
                        )}
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-[18px]">chevron_right</span>
                    </>
                )}
            </div>
        </div>
    )

    const renderSection = (title: string, items: SettingItem[]) => (
        <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider px-6 pb-2">{title}</h3>
            <div className="mx-4 flex flex-col overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-gray-200 dark:border-white/5">
                {items.map((item, i) => renderSettingItem(item, i === items.length - 1))}
            </div>
        </div>
    )

    return (
        <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl border-x border-gray-200 dark:border-white/5">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-white/5">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Settings</h2>
                <button className="flex h-10 px-2 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Done</p>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {renderSection('Device', deviceSettings)}
                {renderSection('Access Control', accessSettings)}
                {renderSection('Security', securitySettings)}
                {renderSection('Notifications', notificationSettings)}

                {/* Danger Zone */}
                <div className="mt-8 px-4">
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 rounded-xl bg-danger/10 border border-danger/30 text-danger font-medium hover:bg-danger/20 transition-colors"
                    >
                        Log Out
                    </button>
                </div>

                {/* App Version */}
                <div className="mt-6 text-center pb-6">
                    <p className="text-gray-500 text-xs">GATEMATE v1.0.0</p>
                    <p className="text-gray-600 text-xs mt-1">© 2024 Smart Gate Solutions</p>
                </div>
            </main>
        </div>
    )
}
