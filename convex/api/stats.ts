import { query } from '../_generated/server'

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query('locations').collect()
    const schedules = await ctx.db.query('schedules').collect()
    const changes = await ctx.db.query('changes').collect()
    const alerts = await ctx.db.query('alertRules').collect()

    const monitoredCount = locations.filter((l) => l.isMonitored).length
    const activeSchedules = schedules.filter((s) => s.isActive).length
    const totalCaptures = schedules.reduce((sum, s) => sum + s.totalCaptures, 0)
    const highSeverity = changes.filter(
      (c) => c.severity === 'high' || c.severity === 'critical'
    ).length
    const uptimePercent =
      monitoredCount > 0
        ? ((activeSchedules / monitoredCount) * 100).toFixed(2)
        : '100.00'

    return {
      total_locations: locations.length,
      monitored_locations: monitoredCount,
      total_captures: totalCaptures,
      total_changes: changes.length,
      high_severity_changes: highSeverity,
      active_alerts: alerts.filter((a) => a.isActive).length,
      system_uptime: `${uptimePercent}%`,
      last_sync: new Date().toISOString(),
    }
  },
})

export const health = query({
  args: {},
  handler: async () => {
    return {
      status: 'healthy',
      service: 'God Eyes (Convex)',
    }
  },
})
