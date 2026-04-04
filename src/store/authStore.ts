import { create } from 'zustand'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { email: string; username: string; password: string; full_name?: string }) => Promise<boolean>
  logout: () => void
}

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@godeyes.io': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@godeyes.io',
      username: 'admin',
      full_name: 'Commander',
      role: 'superadmin',
    },
  },
}

function loadUsers(): Record<string, { password: string; user: User }> {
  try {
    const stored = localStorage.getItem('godeyes_users')
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return DEMO_USERS
}

function saveUsers(users: Record<string, { password: string; user: User }>) {
  localStorage.setItem('godeyes_users', JSON.stringify(users))
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try {
      const session = localStorage.getItem('godeyes_session')
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  })(),
  isAuthenticated: !!localStorage.getItem('godeyes_session'),

  login: async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600))
    const users = loadUsers()
    const entry = users[email]
    if (entry && entry.password === password) {
      localStorage.setItem('godeyes_session', JSON.stringify(entry.user))
      set({ user: entry.user, isAuthenticated: true })
      return true
    }
    if (email && password.length >= 6) {
      const user: User = {
        id: Date.now().toString(),
        email,
        username: email.split('@')[0],
        full_name: email.split('@')[0],
        role: 'operator',
      }
      users[email] = { password, user }
      saveUsers(users)
      localStorage.setItem('godeyes_session', JSON.stringify(user))
      set({ user, isAuthenticated: true })
      return true
    }
    return false
  },

  register: async (data) => {
    await new Promise((r) => setTimeout(r, 600))
    const users = loadUsers()
    if (users[data.email]) return false
    const user: User = {
      id: Date.now().toString(),
      email: data.email,
      username: data.username,
      full_name: data.full_name || data.username,
      role: 'operator',
    }
    users[data.email] = { password: data.password, user }
    saveUsers(users)
    localStorage.setItem('godeyes_session', JSON.stringify(user))
    set({ user, isAuthenticated: true })
    return true
  },

  logout: () => {
    localStorage.removeItem('godeyes_session')
    set({ user: null, isAuthenticated: false })
  },
}))
