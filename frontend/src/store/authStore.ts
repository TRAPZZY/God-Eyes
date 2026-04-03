import { create } from 'zustand'
import type { AuthState, User } from '../types'
import { authAPI } from '../services/api'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; username: string; password: string; full_name?: string }) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ accessToken: data.access_token, refreshToken: data.refresh_token, isAuthenticated: true })
  },

  register: async (data) => {
    await authAPI.register(data)
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      const { data } = await authAPI.getMe()
      set({ user: data })
    } catch {
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    }
  },
}))
