import { query } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {
    page: v.optional(v.number()),
    per_page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const captures = await ctx.db.query('captures').collect()

    const sorted = captures.sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    )

    const page = args.page ?? 1
    const perPage = args.per_page ?? 20
    const start = (page - 1) * perPage
    const paginated = sorted.slice(start, start + perPage)

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
      total: sorted.length,
    }
  },
})

export const byLocation = query({
  args: { locationId: v.id('locations') },
  handler: async (ctx, args) => {
    const captures = await ctx.db
      .query('captures')
      .withIndex('by_location', (q) => q.eq('locationId', args.locationId))
      .collect()

    return captures
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
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
