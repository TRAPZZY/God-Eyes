/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test, describe, beforeEach } from 'vitest'
import { api } from '../../_generated/api.js'
import schema from '../../schema.js'

const modules = {
  'api/sessions.ts': () => import('./sessions.js'),
  'api/locations.ts': () => import('./locations.js'),
  'api/locationsMutations.ts': () => import('./locationsMutations.js'),
  'api/captures.ts': () => import('./captures.js'),
  'api/capturesMutations.ts': () => import('./capturesMutations.js'),
  'api/changes.ts': () => import('./changes.js'),
  'api/schedules.ts': () => import('./schedules.js'),
  'api/stats.ts': () => import('./stats.js'),
  'api/alerts.ts': () => import('./alerts.js'),
  '_generated/server.js': () => import('../../_generated/server.js'),
}

describe('sessions API', () => {
  const t = convexTest(schema, modules)

  describe('currentUser', () => {
    test('returns null when no user is authenticated', async () => {
      const result = await t.query(api.sessions.currentUser, {})
      expect(result).toBeNull()
    })
  })

  describe('signUp', () => {
    test('creates a new user with valid email and username', async () => {
      const result = await t.mutation(api.sessions.signUp, {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('userId')
    })

    test('throws error when email is already registered', async () => {
      await t.mutation(api.sessions.signUp, {
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'password123',
      })

      await expect(
        t.mutation(api.sessions.signUp, {
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'password456',
        })
      ).rejects.toThrow('Email already registered')
    })

    test('creates user with optional fullName', async () => {
      const result = await t.mutation(api.sessions.signUp, {
        email: 'fullname@example.com',
        username: 'fullnameuser',
        password: 'password123',
        fullName: 'Test User',
      })

      expect(result).toHaveProperty('success', true)
    })
  })

  describe('signIn', () => {
    test('returns success for existing user', async () => {
      await t.mutation(api.sessions.signUp, {
        email: 'login@example.com',
        username: 'loginuser',
        password: 'password123',
      })

      const result = await t.mutation(api.sessions.signIn, {
        email: 'login@example.com',
        password: 'password123',
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('email', 'login@example.com')
      expect(result).toHaveProperty('username', 'loginuser')
    })

    test('throws error for non-existent user', async () => {
      await expect(
        t.mutation(api.sessions.signIn, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password')
    })
  })

  describe('signOut', () => {
    test('returns success', async () => {
      const result = await t.mutation(api.sessions.signOut, {})
      expect(result).toHaveProperty('success', true)
    })
  })
})
