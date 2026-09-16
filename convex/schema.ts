import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal('operator'), v.literal('analyst'), v.literal('admin'), v.literal('superadmin'))),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_username', ['username']),

  locations: defineTable({
    userId: v.id('users'),
    name: v.string(),
    address: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    zoomLevel: v.number(),
    isMonitored: v.boolean(),
    tags: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_monitored', ['userId', 'isMonitored'])
    .index('by_monitored', ['isMonitored']),

  captures: defineTable({
    userId: v.id('users'),
    locationId: v.id('locations'),
    imageUrl: v.optional(v.string()),
    imagePath: v.optional(v.string()),
    resolution: v.string(),
    source: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    zoomLevel: v.optional(v.number()),
    capturedAt: v.string(),
    cloudCoverage: v.optional(v.number()),
    imageMetadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_location', ['locationId'])
    .index('by_user', ['userId'])
    .index('by_captured_at', ['capturedAt']),

  changes: defineTable({
    locationId: v.id('locations'),
    userId: v.id('users'),
    beforeCaptureId: v.optional(v.id('captures')),
    afterCaptureId: v.optional(v.id('captures')),
    changeScore: v.number(),
    changeType: v.optional(v.any()),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    description: v.optional(v.string()),
    diffImagePath: v.optional(v.string()),
    detectedAt: v.string(),
    alertSent: v.boolean(),
    reviewed: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_location', ['locationId'])
    .index('by_severity', ['severity'])
    .index('by_user_and_detected_at', ['userId', 'detectedAt'])
    .index('by_detected_at', ['detectedAt']),

  schedules: defineTable({
    userId: v.id('users'),
    locationId: v.id('locations'),
    frequency: v.string(),
    captureResolution: v.string(),
    captureStyle: v.string(),
    nextCaptureAt: v.optional(v.string()),
    lastCaptureAt: v.optional(v.string()),
    totalCaptures: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_location', ['locationId'])
    .index('by_user', ['userId']),

  alertRules: defineTable({
    userId: v.id('users'),
    locationId: v.id('locations'),
    ruleType: v.string(),
    name: v.string(),
    conditions: v.optional(v.any()),
    threshold: v.optional(v.number()),
    notificationChannel: v.string(),
    notificationTarget: v.optional(v.string()),
    isActive: v.boolean(),
    triggeredCount: v.number(),
    lastTriggeredAt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_location', ['locationId'])
    .index('by_user', ['userId']),
})
