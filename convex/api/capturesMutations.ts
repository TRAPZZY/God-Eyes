import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    location_id: v.id('locations'),
    resolution: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.location_id)
    if (!location) {
      throw new Error('Location not found')
    }

    const captureId = await ctx.db.insert('captures', {
      userId: '' as any,
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
