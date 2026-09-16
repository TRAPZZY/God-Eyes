import { query } from '../_generated/server'
import { requireUserId } from './authHelpers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const changes = await ctx.db
      .query('changes')
      .withIndex('by_user_and_detected_at', (q) => q.eq('userId', userId))
      .order('desc')
      .take(100)

    return changes
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
