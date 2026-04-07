import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db.query('schedules').collect()

    return schedules.map((s) => ({
      id: s._id,
      location_id: s.locationId,
      frequency: s.frequency,
      capture_resolution: s.captureResolution,
      capture_style: s.captureStyle,
      next_capture_at: s.nextCaptureAt ?? null,
      last_capture_at: s.lastCaptureAt ?? null,
      total_captures: s.totalCaptures,
      is_active: s.isActive,
      created_at: new Date(s.createdAt).toISOString(),
      updated_at: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
    }))
  },
})

export const create = mutation({
  args: {
    location_id: v.id('locations'),
    frequency: v.string(),
    capture_resolution: v.optional(v.string()),
    capture_style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scheduleId = await ctx.db.insert('schedules', {
      userId: '' as any,
      locationId: args.location_id,
      frequency: args.frequency,
      captureResolution: args.capture_resolution ?? 'standard',
      captureStyle: args.capture_style ?? 'satellite',
      nextCaptureAt: undefined,
      lastCaptureAt: undefined,
      totalCaptures: 0,
      isActive: true,
      createdAt: Date.now(),
    })

    return scheduleId
  },
})
