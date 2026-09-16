import { query } from '../_generated/server'
import { v } from 'convex/values'
import { limitPage, requireOwnedLocation, requireUserId } from './authHelpers'

export const list = query({
  args: {
    page: v.optional(v.number()),
    per_page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const page = args.page ?? 1
    const perPage = limitPage(args.per_page)
    const start = (page - 1) * perPage
    const captures = await ctx.db
      .query('captures')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(start + perPage)
    const paginated = captures.slice(start, start + perPage)

    return {
      captures: paginated.map((c) => ({
        id: c._id,
        location_id: c.locationId,
        image_url: c.imageUrl ?? null,
        image_path: c.imagePath ?? null,
        resolution: c.resolution,
        source: c.source,
        width: c.width ?? null,
        height: c.height ?? null,
        zoom_level: c.zoomLevel ?? null,
        captured_at: c.capturedAt,
        cloud_coverage: c.cloudCoverage ?? null,
        image_metadata: c.imageMetadata ?? null,
        created_at: new Date(c.createdAt).toISOString(),
      })),
      total: captures.length,
    }
  },
})

export const byLocation = query({
  args: { locationId: v.id('locations') },
  handler: async (ctx, args) => {
    await requireOwnedLocation(ctx, args.locationId)
    const captures = await ctx.db
      .query('captures')
      .withIndex('by_location', (q) => q.eq('locationId', args.locationId))
      .order('desc')
      .take(100)

    return captures
      .map((c) => ({
        id: c._id,
        location_id: c.locationId,
        image_url: c.imageUrl ?? null,
        image_path: c.imagePath ?? null,
        resolution: c.resolution,
        source: c.source,
        width: c.width ?? null,
        height: c.height ?? null,
        zoom_level: c.zoomLevel ?? null,
        captured_at: c.capturedAt,
        cloud_coverage: c.cloudCoverage ?? null,
        image_metadata: c.imageMetadata ?? null,
        created_at: new Date(c.createdAt).toISOString(),
      }))
  },
})
