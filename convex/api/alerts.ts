import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const alerts = await ctx.db
      .query('alertRules')
      .withIndex('by_user', (q) => q.eq('userId', identity.tokenIdentifier))
      .collect()

    return alerts.map((a) => ({
      id: a._id,
      user_id: a.userId,
      location_id: a.locationId,
      rule_type: a.ruleType,
      name: a.name,
      conditions: a.conditions ?? null,
      threshold: a.threshold ?? null,
      notification_channel: a.notificationChannel,
      notification_target: a.notificationTarget ?? null,
      is_active: a.isActive,
      triggered_count: a.triggeredCount,
      last_triggered_at: a.lastTriggeredAt ?? null,
      created_at: new Date(a.createdAt).toISOString(),
      updated_at: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
    }))
  },
})

export const create = mutation({
  args: {
    location_id: v.id('locations'),
    rule_type: v.string(),
    name: v.string(),
    notification_target: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const location = await ctx.db.get(args.location_id)
    if (!location || location.userId !== identity.tokenIdentifier) {
      throw new Error('Location not found')
    }

    const alertId = await ctx.db.insert('alertRules', {
      userId: identity.tokenIdentifier,
      locationId: args.location_id,
      ruleType: args.rule_type,
      name: args.name,
      conditions: null,
      threshold: null,
      notificationChannel: 'email',
      notificationTarget: args.notification_target,
      isActive: true,
      triggeredCount: 0,
      lastTriggeredAt: null,
      createdAt: Date.now(),
    })

    return alertId
  },
})
