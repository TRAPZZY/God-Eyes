import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { requireOwnedLocation } from './authHelpers'

export const create = mutation({
  args: {
    location_id: v.id('locations'),
    resolution: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, location } = await requireOwnedLocation(ctx, args.location_id)

    const captureId = await ctx.db.insert('captures', {
      userId,
      locationId: args.location_id,
      imageUrl: undefined,
      imagePath: undefined,
      resolution: args.resolution ?? 'standard',
      source: 'mapbox',
      width: undefined,
      height: undefined,
      zoomLevel: location.zoomLevel,
      capturedAt: new Date().toISOString(),
      cloudCoverage: undefined,
      imageMetadata: undefined,
      createdAt: Date.now(),
    })

    return captureId
  },
})
