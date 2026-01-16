import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Schedule {
    id: string
    time: string
    action: 'open' | 'close' | 'lock'
    recurrence: string
    enabled: boolean
}

const initialSchedules: Schedule[] = [
    { id: '1', time: '7:00 AM', action: 'open', recurrence: 'Daily', enabled: true },
    { id: '2', time: '8:30 PM', action: 'close', recurrence: 'Weekdays', enabled: true },
    { id: '3', time: '10:00 PM', action: 'lock', recurrence: 'Weekends', enabled: false },
]

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Calendar data for September 2023
const calendarDays = [
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true, isSelected: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true, hasEvent: true },
    { day: 4, isCurrentMonth: true, hasEvent: true },
    { day: 5, isCurrentMonth: true, hasEvent: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
]

export default function Schedule() {
    const navigate = useNavigate()
    const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
    const [showModal, setShowModal] = useState(false)
    const [selectedAction, setSelectedAction] = useState<'open' | 'close'>('open')

    const toggleSchedule = (id: string) => {
        setSchedules(schedules.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ))
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'open': return 'meeting_room'
            case 'close': return 'door_front'
            case 'lock': return 'lock'
            default: return 'schedule'
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case 'open': return { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary' }
            case 'close': return { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-500' }
            case 'lock': return { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-500' }
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-500' }
        }
    }

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 px-4 py-4 backdrop-blur-md dark:bg-background-dark/80">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">Schedule Management</h1>
                <div className="size-10" />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                {/* Calendar Strip */}
                <div className="px-4 pb-6 pt-2">
                    <div className="rounded-xl bg-surface-dark/50 p-4 dark:bg-[#1c1c1e]">
                        <div className="mb-4 flex items-center justify-between">
                            <button className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span className="text-base font-semibold">September 2023</span>
                            <button className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Days Header */}
                            {days.map((day, i) => (
                                <div key={i} className="text-[11px] font-medium text-gray-500 uppercase">{day}</div>
                            ))}
                            {/* Calendar Days */}
                            {calendarDays.map((item, i) => (
                                <button
                                    key={i}
                                    className={`flex h-9 w-full flex-col items-center justify-center rounded-full text-sm font-medium transition-all ${item.isSelected
                                            ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                                            : item.isCurrentMonth
                                                ? 'text-white hover:bg-white/10'
                                                : 'text-gray-600'
                                        }`}
                                >
                                    {item.day}
                                    {item.hasEvent && !item.isSelected && (
                                        <span className="mt-0.5 size-1 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="flex flex-col gap-3 px-4">
                    <h3 className="ml-1 text-sm font-medium text-gray-500">Upcoming Schedules</h3>

                    {schedules.map((schedule) => {
                        const colors = getActionColor(schedule.action)
                        return (
                            <div
                                key={schedule.id}
                                className="group relative flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all active:scale-[0.98] dark:bg-[#1E1E1E]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                                        <span className="material-symbols-outlined filled">{getActionIcon(schedule.action)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xl font-bold leading-none tracking-tight ${schedule.enabled ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {schedule.time}
                                        </span>
                                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <span className={`uppercase tracking-wider ${schedule.enabled ? colors.text : ''}`}>
                                                {schedule.action.charAt(0).toUpperCase() + schedule.action.slice(1)}
                                            </span>
                                            <span className="size-1 rounded-full bg-gray-600" />
                                            <span>{schedule.recurrence}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={schedule.enabled}
                                        onChange={() => toggleSchedule(schedule.id)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-7 w-12 rounded-full bg-gray-700 after:absolute after:start-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                                </label>
                            </div>
                        )
                    })}
                </div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowModal(true)}
                className="absolute bottom-6 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-info text-white shadow-xl shadow-blue-500/30 transition-transform active:scale-90 hover:scale-105"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add</span>
            </button>

            {/* Modal */}
            {showModal && (
                <>
                    {/* Modal Backdrop */}
                    <div
                        onClick={() => setShowModal(false)}
                        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]"
                    />

                    {/* Add Schedule Modal */}
                    <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md w-full rounded-t-2xl bg-[#1c1c1e] px-6 pt-2 pb-8 shadow-2xl ring-1 ring-white/10">
                        {/* Handle */}
                        <div className="mx-auto mb-6 h-1.5 w-10 rounded-full bg-white/20" />

                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">New Schedule</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-sm font-medium text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Time Picker Mock */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative flex items-center gap-1 rounded-xl bg-black/20 px-8 py-4">
                                {/* Hour */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-600">06</span>
                                    <span className="text-4xl font-bold text-white">07</span>
                                    <span className="text-2xl font-bold text-gray-600">08</span>
                                </div>
                                <div className="pb-1 text-2xl font-bold text-gray-500">:</div>
                                {/* Minute */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-600">59</span>
                                    <span className="text-4xl font-bold text-white">00</span>
                                    <span className="text-2xl font-bold text-gray-600">01</span>
                                </div>
                                {/* AM/PM */}
                                <div className="ml-4 flex flex-col gap-2">
                                    <div className="rounded bg-primary px-2 py-1 text-xs font-bold text-black">AM</div>
                                    <div className="px-2 py-1 text-xs font-bold text-gray-500">PM</div>
                                </div>
                                {/* Selection Indicator */}
                                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 border-y border-white/10" />
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Action Select */}
                            <div className="flex w-full rounded-xl bg-black/30 p-1">
                                <button
                                    onClick={() => setSelectedAction('open')}
                                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${selectedAction === 'open'
                                            ? 'bg-primary text-black shadow-sm'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Open
                                </button>
                                <button
                                    onClick={() => setSelectedAction('close')}
                                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${selectedAction === 'close'
                                            ? 'bg-primary text-black shadow-sm'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Close
                                </button>
                            </div>

                            {/* Recurrence */}
                            <div className="flex items-center justify-between rounded-xl bg-[#2c2c2e] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-700 text-white">
                                        <span className="material-symbols-outlined text-lg">repeat</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">Recurrence</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <span>Daily</span>
                                    <span className="material-symbols-outlined text-base">chevron_right</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center justify-between rounded-xl bg-[#2c2c2e] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-700 text-white">
                                        <span className="material-symbols-outlined text-lg">timer</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">Duration</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Until closed manually</span>
                                    <span className="material-symbols-outlined text-base">chevron_right</span>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-8 w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-black transition-colors hover:bg-green-400"
                        >
                            Save Schedule
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
