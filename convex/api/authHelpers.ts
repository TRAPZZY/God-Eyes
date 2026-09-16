import { getAuthUserId } from '@convex-dev/auth/server'
import type { QueryCtx, MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

type AuthCtx = QueryCtx | MutationCtx

export async function requireUserId(ctx: AuthCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (userId === null) {
    throw new Error('Authentication required')
  }
  return userId
}

export async function requireOwnedLocation(ctx: AuthCtx, locationId: Id<'locations'>) {
  const userId = await requireUserId(ctx)
  const location = await ctx.db.get(locationId)
  if (!location || location.userId !== userId) {
    throw new Error('Location not found')
  }
  return { userId, location }
}

export function limitPage(perPage?: number) {
  return Math.min(Math.max(perPage ?? 20, 1), 100)
}
