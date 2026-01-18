import { type HTMLAttributes } from 'react'

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
    name: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    filled?: boolean
    className?: string
}

const sizes = {
    sm: 'text-[16px]',
    md: 'text-[20px]',
    lg: 'text-[24px]',
    xl: 'text-[32px]',
}

export default function Icon({
    name,
    size = 'md',
    filled = false,
    className = '',
    ...props
}: IconProps) {
    return (
        <span
            className={`
        material-symbols-outlined
        ${filled ? 'filled' : ''}
        ${sizes[size]}
        ${className}
      `}
            aria-hidden="true"
            {...props}
        >
            {name}
        </span>
    )
}

// Common icon presets for convenience
export const Icons = {
    // Navigation
    home: 'home',
    dashboard: 'dashboard',
    settings: 'settings',
    menu: 'menu',
    close: 'close',
    back: 'arrow_back',
    forward: 'arrow_forward',

    // Actions
    add: 'add',
    edit: 'edit',
    delete: 'delete',
    save: 'save',
    refresh: 'refresh',

    // Gate related
    gate: 'door_sliding',
    gateOpen: 'door_open',
    gateClosed: 'door_front',
    lock: 'lock',
    unlock: 'lock_open',

    // Status
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
    loading: 'progress_activity',

    // Security
    security: 'security',
    shield: 'shield',
    verified: 'verified_user',

    // User
    user: 'person',
    users: 'group',

    // Communication
    notification: 'notifications',
    email: 'mail',

    // Schedule
    schedule: 'schedule',
    calendar: 'calendar_today',

    // Device
    wifi: 'wifi',
    bluetooth: 'bluetooth',
    power: 'power_settings_new',
}
