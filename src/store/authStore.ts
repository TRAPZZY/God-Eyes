import { create } from 'zustand'

interface AuthStore {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoading: false,
  error: null,
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
