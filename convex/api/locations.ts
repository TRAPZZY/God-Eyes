import { query } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { monitoredOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_user', (q) => q.eq('userId', identity.tokenIdentifier))
      .filter((q) => args.monitoredOnly ? q.eq('isMonitored', true) : q.eq('isMonitored', true))
      .collect()

    return locations.map((loc) => ({
      id: loc._id,
      user_id: loc.userId,
      name: loc.name,
      address: loc.address ?? null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      zoom_level: loc.zoomLevel,
      is_monitored: loc.isMonitored,
      tags: loc.tags ?? null,
      notes: loc.notes ?? null,
      created_at: new Date(loc.createdAt).toISOString(),
      updated_at: loc.updatedAt ? new Date(loc.updatedAt).toISOString() : null,
    }))
  },
})

export const get = query({
  args: { id: v.id('locations') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const location = await ctx.db.get(args.id)
    if (!location || location.userId !== identity.tokenIdentifier) {
      throw new Error('Location not found')
    }
    return {
      id: location._id,
      user_id: location.userId,
      name: location.name,
      address: location.address ?? null,
      latitude: location.latitude,
      longitude: location.longitude,
      zoom_level: location.zoomLevel,
      is_monitored: location.isMonitored,
      tags: location.tags ?? null,
      notes: location.notes ?? null,
      created_at: new Date(location.createdAt).toISOString(),
      updated_at: location.updatedAt ? new Date(location.updatedAt).toISOString() : null,
    }
  },
})
