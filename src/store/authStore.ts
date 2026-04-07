import { create } from 'zustand'
import { apiLogin, apiRegister, apiGetMe, apiLogout } from '../services/api'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { email: string; username: string; password: string; full_name?: string }) => Promise<boolean>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loadUser: async () => {
    const token = localStorage.getItem('godeyes_access_token')
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const data = await apiGetMe()
      set({
        user: {
          id: data.id,
          email: data.email,
          username: data.username,
          full_name: data.full_name || data.username,
          role: data.role as User['role'],
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (err: unknown) {
      apiLogout()
      const message = err instanceof Error ? err.message : 'Session expired'
      set({ user: null, isAuthenticated: false, isLoading: false, error: message })
      console.error('Session validation failed:', err)
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiLogin(email, password)
      const data = await apiGetMe()
      set({
        user: {
          id: data.id,
          email: data.email,
          username: data.username,
          full_name: data.full_name || data.username,
          role: data.role as User['role'],
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      set({ isLoading: false, error: message, user: null, isAuthenticated: false })
      return false
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await apiRegister(data)
      await apiLogin(data.email, data.password)
      const userData = await apiGetMe()
      set({
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name || userData.username,
          role: userData.role as User['role'],
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: () => {
    apiLogout()
    set({ user: null, isAuthenticated: false, error: null })
  },
}))
