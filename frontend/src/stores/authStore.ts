import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role: 'admin' | 'user' | 'guest'
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    setUser: (user: User) => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            login: async (email: string, password: string) => {
                try {
                    set({ isLoading: true })

                    // TODO: Replace with actual API call
                    // Simulating API call for demo
                    await new Promise(resolve => setTimeout(resolve, 1000))

                    // Demo user
                    const mockUser: User = {
                        id: '1',
                        email,
                        name: 'Alex Johnson',
                        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQQr4aqx2fa80RLGEVHtgGrtt3GYuhXcI6BEHKmd7YHt84ZcehgdRiqY3PAMLTVCdOqdcqDJDHiPRWZaWa1SjSO5Q3X3-xQjbJoc1gvOaL6IQL-HlRN4Dwe_PGM2mRR6R17IS70JlEyeN1ZZ4nGQizsoNdsf7DLrwCzrAAKFkQsg2iRnpTcrf2fG53KZwAfurMtcIlpcrmZcWcy2GZ0lk2w62VlhkBz2zvPYi5KpQhnUldFopDGBNAYxOGUgIH8ImF6LH6BTAkTkZ9',
                        role: 'admin',
                    }

                    set({
                        user: mockUser,
                        token: 'mock-jwt-token',
                        isAuthenticated: true,
                        isLoading: false,
                    })
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                })
            },

            setUser: (user) => set({ user }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'gatemate-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Set loading to false once rehydrated
                state?.setLoading(false)
            },
        }
    )
)
