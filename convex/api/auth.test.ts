/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from '../_generated/api'
import schema from '../schema'
import type { Id } from '../_generated/dataModel'

const modules = {
  'api/alerts.ts': () => import('./alerts'),
  'api/authHelpers.ts': () => import('./authHelpers'),
  'api/captures.ts': () => import('./captures'),
  'api/capturesMutations.ts': () => import('./capturesMutations'),
  'api/changes.ts': () => import('./changes'),
  'api/locations.ts': () => import('./locations'),
  'api/locationsMutations.ts': () => import('./locationsMutations'),
  'api/schedules.ts': () => import('./schedules'),
  'api/sessions.ts': () => import('./sessions'),
  'api/stats.ts': () => import('./stats'),
  'auth.ts': () => import('../auth'),
  '_generated/api.js': () => import('../_generated/api'),
  '_generated/server.js': () => import('../_generated/server'),
}
const publicApi = api.api

async function createTestUser(t: ReturnType<typeof convexTest>, email: string) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      email,
      username: email.split('@')[0],
      name: email.split('@')[0],
      fullName: email.split('@')[0],
      role: 'operator',
      isActive: true,
      createdAt: Date.now(),
    })
  })
}

function asUser(t: ReturnType<typeof convexTest>, userId: Id<'users'>) {
  return t.withIdentity({
    subject: `${userId}|test-session`,
    tokenIdentifier: `${userId}|test-session`,
  })
}

describe('authenticated Convex API', () => {
  test('currentUser returns null without a session', async () => {
    const t = convexTest(schema, modules)

    const result = await t.query(publicApi.sessions.currentUser, {})

    expect(result).toBeNull()
  })

  test('currentUser returns the authenticated user profile', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t, 'alice@example.com')

    const result = await asUser(t, userId).query(publicApi.sessions.currentUser, {})

    expect(result).toMatchObject({
      id: userId,
      email: 'alice@example.com',
      username: 'alice',
      role: 'operator',
      is_active: true,
    })
  })

  test('locations require authentication', async () => {
    const t = convexTest(schema, modules)

    await expect(t.query(publicApi.locations.list, {})).rejects.toThrow('Authentication required')
    await expect(t.mutation(publicApi.locationsMutations.create, {
      name: 'Restricted Site',
      latitude: 10,
      longitude: 20,
    })).rejects.toThrow('Authentication required')
  })

  test('users can only read their own locations', async () => {
    const t = convexTest(schema, modules)
    const aliceId = await createTestUser(t, 'alice@example.com')
    const bobId = await createTestUser(t, 'bob@example.com')

    const locationId = await asUser(t, aliceId).mutation(publicApi.locationsMutations.create, {
      name: 'Alice Site',
      latitude: 10,
      longitude: 20,
    })

    const aliceLocations = await asUser(t, aliceId).query(publicApi.locations.list, {})
    const bobLocations = await asUser(t, bobId).query(publicApi.locations.list, {})
    const bobLookup = await asUser(t, bobId).query(publicApi.locations.get, { id: locationId })

    expect(aliceLocations).toHaveLength(1)
    expect(aliceLocations[0].id).toBe(locationId)
    expect(aliceLocations[0].user_id).toBe(aliceId)
    expect(bobLocations).toEqual([])
    expect(bobLookup).toBeNull()
  })

  test('location-linked mutations enforce ownership', async () => {
    const t = convexTest(schema, modules)
    const aliceId = await createTestUser(t, 'alice@example.com')
    const bobId = await createTestUser(t, 'bob@example.com')

    const locationId = await asUser(t, aliceId).mutation(publicApi.locationsMutations.create, {
      name: 'Alice Site',
      latitude: 10,
      longitude: 20,
    })

    await expect(asUser(t, bobId).mutation(publicApi.capturesMutations.create, {
      location_id: locationId,
    })).rejects.toThrow('Location not found')

    await expect(asUser(t, bobId).mutation(publicApi.schedules.create, {
      location_id: locationId,
      frequency: 'daily',
    })).rejects.toThrow('Location not found')

    await expect(asUser(t, bobId).mutation(publicApi.alerts.create, {
      location_id: locationId,
      rule_type: 'change',
      name: 'Watch changes',
    })).rejects.toThrow('Location not found')
  })
})
