import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
    { to: '/dashboard', icon: 'home', label: 'Home' },
    { to: '/cameras', icon: 'videocam', label: 'Cameras' },
    { to: '/logs', icon: 'history', label: 'Logs' },
    { to: '/settings', icon: 'person', label: 'Profile' },
]

export default function Layout() {
    return (
        <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
            {/* Skip to Content (Accessibility) */}
            <a href="#main-content" className="skip-to-content">
                Lewati ke konten utama
            </a>

            {/* Main Content */}
            <main id="main-content" className="flex-1 overflow-y-auto pb-24 no-scrollbar" role="main">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav
                className="fixed bottom-0 w-full max-w-md bg-surface-dark border-t border-white/5 backdrop-blur-lg z-50"
                role="navigation"
                aria-label="Menu utama"
            >
                <div className="flex items-center justify-around h-[80px] pb-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            aria-label={item.label}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors touch-feedback ${isActive
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}
                                        aria-hidden="true"
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    )
}

