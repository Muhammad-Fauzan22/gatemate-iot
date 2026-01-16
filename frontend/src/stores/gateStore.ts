import { create } from 'zustand'

export type GateStatus = 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'error'

export interface Gate {
    id: string
    name: string
    status: GateStatus
    percentage: number // 0-100
    isOnline: boolean
    lastActivity: string
    sensors: {
        current: number
        voltage: number
        temperature: number
        wifiSignal: number
    }
}

export interface SensorData {
    current: number
    voltage: number
    temperature: number
    wifiSignal: number
    timestamp: string
}

interface GateState {
    gates: Gate[]
    selectedGate: Gate | null
    isConnected: boolean

    // Actions
    setGates: (gates: Gate[]) => void
    selectGate: (gate: Gate | null) => void
    updateGateStatus: (gateId: string, status: Partial<Gate>) => void
    setConnected: (connected: boolean) => void

    // Gate operations
    openGate: (gateId: string) => Promise<void>
    closeGate: (gateId: string) => Promise<void>
    stopGate: (gateId: string) => Promise<void>
    setGatePercentage: (gateId: string, percentage: number) => Promise<void>
}

export const useGateStore = create<GateState>((set, get) => ({
    gates: [
        {
            id: '1',
            name: 'North Entrance',
            status: 'closed',
            percentage: 0,
            isOnline: true,
            lastActivity: new Date().toISOString(),
            sensors: {
                current: 2.5,
                voltage: 220,
                temperature: 32,
                wifiSignal: -45,
            },
        },
        {
            id: '2',
            name: 'South Gate',
            status: 'closed',
            percentage: 0,
            isOnline: true,
            lastActivity: new Date().toISOString(),
            sensors: {
                current: 1.8,
                voltage: 218,
                temperature: 30,
                wifiSignal: -52,
            },
        },
    ],
    selectedGate: null,
    isConnected: true,

    setGates: (gates) => set({ gates }),

    selectGate: (gate) => set({ selectedGate: gate }),

    updateGateStatus: (gateId, status) => {
        set((state) => ({
            gates: state.gates.map((g) =>
                g.id === gateId ? { ...g, ...status } : g
            ),
            selectedGate:
                state.selectedGate?.id === gateId
                    ? { ...state.selectedGate, ...status }
                    : state.selectedGate,
        }))
    },

    setConnected: (connected) => set({ isConnected: connected }),

    openGate: async (gateId) => {
        const { updateGateStatus } = get()
        updateGateStatus(gateId, { status: 'opening' })

        // Simulate gate opening animation
        for (let i = 0; i <= 100; i += 5) {
            await new Promise((r) => setTimeout(r, 150))
            updateGateStatus(gateId, { percentage: i })
        }

        updateGateStatus(gateId, { status: 'open', percentage: 100 })
    },

    closeGate: async (gateId) => {
        const { updateGateStatus, gates } = get()
        const gate = gates.find((g) => g.id === gateId)
        if (!gate) return

        updateGateStatus(gateId, { status: 'closing' })

        // Simulate gate closing animation
        for (let i = gate.percentage; i >= 0; i -= 5) {
            await new Promise((r) => setTimeout(r, 150))
            updateGateStatus(gateId, { percentage: i })
        }

        updateGateStatus(gateId, { status: 'closed', percentage: 0 })
    },

    stopGate: async (gateId) => {
        const { updateGateStatus } = get()
        updateGateStatus(gateId, { status: 'stopped' })
    },

    setGatePercentage: async (gateId, percentage) => {
        const { updateGateStatus, gates } = get()
        const gate = gates.find((g) => g.id === gateId)
        if (!gate) return

        const direction = percentage > gate.percentage ? 'opening' : 'closing'
        updateGateStatus(gateId, { status: direction })

        // Animate to target percentage
        const step = percentage > gate.percentage ? 5 : -5
        let current = gate.percentage

        while ((step > 0 && current < percentage) || (step < 0 && current > percentage)) {
            await new Promise((r) => setTimeout(r, 100))
            current = Math.min(Math.max(current + step, 0), 100)
            updateGateStatus(gateId, { percentage: current })
        }

        updateGateStatus(gateId, {
            status: percentage === 100 ? 'open' : percentage === 0 ? 'closed' : 'stopped',
            percentage,
        })
    },
}))
