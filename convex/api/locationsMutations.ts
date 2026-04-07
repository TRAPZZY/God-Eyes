import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    zoom_level: v.optional(v.number()),
    tags: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const locationId = await ctx.db.insert('locations', {
      userId: '' as any,
      name: args.name,
      latitude: args.latitude,
      longitude: args.longitude,
      address: args.address,
      zoomLevel: args.zoom_level ?? 14,
      isMonitored: false,
      tags: args.tags,
      notes: args.notes,
      createdAt: Date.now(),
    })

    return locationId
  },
})

export const update = mutation({
  args: {
    id: v.id('locations'),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    zoom_level: v.optional(v.number()),
    is_monitored: v.optional(v.boolean()),
    tags: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.id)
    if (!location) {
      throw new Error('Location not found')
    }

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.address !== undefined && { address: args.address }),
      ...(args.latitude !== undefined && { latitude: args.latitude }),
      ...(args.longitude !== undefined && { longitude: args.longitude }),
      ...(args.zoom_level !== undefined && { zoomLevel: args.zoom_level }),
      ...(args.is_monitored !== undefined && { isMonitored: args.is_monitored }),
      ...(args.tags !== undefined && { tags: args.tags }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id('locations') },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.id)
    if (!location) {
      throw new Error('Location not found')
    }

    await ctx.db.delete(args.id)
  },
})

export const toggleMonitor = mutation({
  args: { id: v.id('locations'), isMonitored: v.boolean() },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.id)
    if (!location) {
      throw new Error('Location not found')
    }

    await ctx.db.patch(args.id, {
      isMonitored: args.isMonitored,
      updatedAt: Date.now(),
    })
  },
})
