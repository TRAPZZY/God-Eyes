export type Id<T extends string = string> = string & { __tableName: T }

export type BackendLocation = {
  id: Id
  user_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  zoom_level: number
  is_monitored: boolean
  tags: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export type BackendCapture = {
  id: Id
  location_id: Id
  image_url: string | null
  image_path: string | null
  resolution: string
  source: string
  width: number | null
  height: number | null
  zoom_level: number | null
  captured_at: string
  cloud_coverage: number | null
  image_metadata: Record<string, unknown> | null
  created_at: string
}

export type BackendChange = {
  id: Id
  location_id: Id
  before_capture_id: string
  after_capture_id: string
  change_score: number
  change_type: Record<string, unknown> | null
  severity: string
  description: string | null
  diff_image_path: string | null
  detected_at: string
  alert_sent: boolean
  reviewed: boolean
}

export type BackendSchedule = {
  id: Id
  location_id: Id
  frequency: string
  capture_resolution: string
  capture_style: string
  next_capture_at: string | null
  last_capture_at: string | null
  total_captures: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export type BackendAlertRule = {
  id: Id
  user_id: string
  location_id: Id
  rule_type: string
  name: string
  conditions: Record<string, unknown> | null
  threshold: number | null
  notification_channel: string
  notification_target: string | null
  is_active: boolean
  triggered_count: number
  last_triggered_at: string | null
  created_at: string
  updated_at: string | null
}

export type DashboardStats = {
  total_locations: number
  monitored_locations: number
  total_captures: number
  total_changes: number
  high_severity_changes: number
  active_alerts: number
  system_uptime: string
  last_sync: string
}

export type User = {
  id: Id
  email: string
  username: string
  full_name?: string
  role?: string
}

const api = {
  alerts: {
    list: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
  },
  auth: {
    currentUser: () => Promise.resolve(null),
    signIn: () => Promise.resolve({ success: true }),
    signUp: () => Promise.resolve({ userId: '' }),
    signOut: () => Promise.resolve({ success: true }),
  },
  captures: {
    list: () => Promise.resolve([]),
    byLocation: () => Promise.resolve([]),
  },
  capturesMutations: {
    create: () => Promise.resolve({}),
  },
  changes: {
    list: () => Promise.resolve([]),
  },
  locations: {
    list: () => Promise.resolve([]),
    get: () => Promise.resolve(null),
  },
  locationsMutations: {
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    remove: () => Promise.resolve({}),
    toggleMonitor: () => Promise.resolve({}),
  },
  schedules: {
    list: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
  },
  stats: {
    dashboard: () => Promise.resolve({
      total_locations: 0,
      monitored_locations: 0,
      total_captures: 0,
      total_changes: 0,
      high_severity_changes: 0,
      active_alerts: 0,
      system_uptime: '0h',
      last_sync: new Date().toISOString(),
    }),
    health: () => Promise.resolve({ status: 'ok' }),
  },
} as const

export { api }
