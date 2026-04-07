import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    location_id: v.id('locations'),
    resolution: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const location = await ctx.db.get(args.location_id)
    if (!location || location.userId !== identity.tokenIdentifier) {
      throw new Error('Location not found')
    }

    const captureId = await ctx.db.insert('captures', {
      userId: identity.tokenIdentifier,
      locationId: args.location_id,
      imageUrl: null,
      imagePath: null,
      resolution: args.resolution ?? 'standard',
      source: 'mapbox',
      width: null,
      height: null,
      zoomLevel: location.zoomLevel,
      capturedAt: new Date().toISOString(),
      cloudCoverage: null,
      imageMetadata: null,
      createdAt: Date.now(),
    })

    return captureId
  },
})
