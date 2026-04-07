import { query } from '../_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const changes = await ctx.db
      .query('changes')
      .filter((q) => q.eq(q.field('userId'), identity.tokenIdentifier))
      .collect()

    return changes
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .map((c) => ({
        id: c._id,
        location_id: c.locationId,
        before_capture_id: c.beforeCaptureId ?? '',
        after_capture_id: c.afterCaptureId ?? '',
        change_score: c.changeScore,
        change_type: c.changeType ?? {},
        severity: c.severity,
        description: c.description ?? null,
        diff_image_path: c.diffImagePath ?? null,
        detected_at: c.detectedAt,
        alert_sent: c.alertSent,
        reviewed: c.reviewed,
      }))
  },
})
