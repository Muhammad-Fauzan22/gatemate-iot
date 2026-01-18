import { useCallback } from 'react'
import { useGateStore } from '@/stores/gateStore'
import { useToast } from '@/components/ui'

interface UseGateCommandOptions {
    gateId: string
    onSuccess?: () => void
    onError?: (error: Error) => void
}

export function useGateCommand({ gateId, onSuccess, onError }: UseGateCommandOptions) {
    const { openGate, closeGate, stopGate, setGatePercentage, gates } = useGateStore()
    const { showToast } = useToast()

    const gate = gates.find(g => g.id === gateId)
    const isMoving = gate?.status === 'opening' || gate?.status === 'closing'

    const handleOpen = useCallback(async () => {
        try {
            await openGate(gateId)
            showToast('success', 'Gate opened successfully')
            onSuccess?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to open gate')
            showToast('error', err.message)
            onError?.(err)
        }
    }, [gateId, openGate, showToast, onSuccess, onError])

    const handleClose = useCallback(async () => {
        try {
            await closeGate(gateId)
            showToast('success', 'Gate closed successfully')
            onSuccess?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to close gate')
            showToast('error', err.message)
            onError?.(err)
        }
    }, [gateId, closeGate, showToast, onSuccess, onError])

    const handleStop = useCallback(async () => {
        try {
            await stopGate(gateId)
            showToast('warning', 'Gate stopped')
            onSuccess?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to stop gate')
            showToast('error', err.message)
            onError?.(err)
        }
    }, [gateId, stopGate, showToast, onSuccess, onError])

    const handleSetPosition = useCallback(async (percent: number) => {
        try {
            await setGatePercentage(gateId, percent)
            showToast('info', `Gate set to ${percent}%`)
            onSuccess?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to set gate position')
            showToast('error', err.message)
            onError?.(err)
        }
    }, [gateId, setGatePercentage, showToast, onSuccess, onError])

    return {
        openGate: handleOpen,
        closeGate: handleClose,
        stopGate: handleStop,
        setPosition: handleSetPosition,
        isMoving,
        gate,
    }
}

export default useGateCommand
