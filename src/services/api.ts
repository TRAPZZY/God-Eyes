import type {
  DashboardStats,
  Location,
  Capture,
  ChangeDetection,
  MonitoringSchedule,
  SentinelDate,
  SystemStatus,
  AnalysisResult,
} from '../types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_LOCATIONS: Location[] = [
  {
    id: 'loc-001',
    name: 'Site Alpha - Northern Perimeter',
    latitude: 38.8977,
    longitude: -77.0365,
    address: 'Washington, DC',
    is_monitored: true,
    status: 'active',
    last_capture: '2026-04-03T08:15:00Z',
    capture_count: 1247,
    created_at: '2025-11-12T00:00:00Z',
  },
  {
    id: 'loc-002',
    name: 'Site Bravo - Eastern Corridor',
    latitude: 40.7128,
    longitude: -74.006,
    address: 'New York, NY',
    is_monitored: true,
    status: 'active',
    last_capture: '2026-04-03T07:45:00Z',
    capture_count: 892,
    created_at: '2025-12-01T00:00:00Z',
  },
  {
    id: 'loc-003',
    name: 'Site Charlie - Western Outpost',
    latitude: 34.0522,
    longitude: -118.2437,
    address: 'Los Angeles, CA',
    is_monitored: true,
    status: 'alert',
    last_capture: '2026-04-03T06:30:00Z',
    capture_count: 634,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'loc-004',
    name: 'Site Delta - Southern Watch',
    latitude: 29.7604,
    longitude: -95.3698,
    address: 'Houston, TX',
    is_monitored: false,
    status: 'inactive',
    last_capture: '2026-04-01T14:00:00Z',
    capture_count: 211,
    created_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'loc-005',
    name: 'Site Echo - Central Hub',
    latitude: 41.8781,
    longitude: -87.6298,
    address: 'Chicago, IL',
    is_monitored: true,
    status: 'active',
    last_capture: '2026-04-03T09:00:00Z',
    capture_count: 1583,
    created_at: '2025-10-05T00:00:00Z',
  },
]

const MOCK_CAPTURES: Capture[] = [
  { id: 'cap-001', location_id: 'loc-001', location_name: 'Site Alpha', timestamp: '2026-04-03T08:15:00Z', resolution: '0.5m', cloud_coverage: 2, source: 'Sentinel-2A', thumbnail_url: '' },
  { id: 'cap-002', location_id: 'loc-001', location_name: 'Site Alpha', timestamp: '2026-04-02T08:10:00Z', resolution: '0.5m', cloud_coverage: 5, source: 'Sentinel-2B', thumbnail_url: '' },
  { id: 'cap-003', location_id: 'loc-002', location_name: 'Site Bravo', timestamp: '2026-04-03T07:45:00Z', resolution: '1.0m', cloud_coverage: 12, source: 'Sentinel-2A', thumbnail_url: '' },
  { id: 'cap-004', location_id: 'loc-003', location_name: 'Site Charlie', timestamp: '2026-04-03T06:30:00Z', resolution: '0.5m', cloud_coverage: 0, source: 'Sentinel-2B', thumbnail_url: '' },
  { id: 'cap-005', location_id: 'loc-005', location_name: 'Site Echo', timestamp: '2026-04-03T09:00:00Z', resolution: '0.5m', cloud_coverage: 8, source: 'Sentinel-2A', thumbnail_url: '' },
  { id: 'cap-006', location_id: 'loc-001', location_name: 'Site Alpha', timestamp: '2026-04-01T08:05:00Z', resolution: '1.0m', cloud_coverage: 15, source: 'Sentinel-2A', thumbnail_url: '' },
  { id: 'cap-007', location_id: 'loc-002', location_name: 'Site Bravo', timestamp: '2026-04-02T07:40:00Z', resolution: '0.5m', cloud_coverage: 3, source: 'Sentinel-2B', thumbnail_url: '' },
  { id: 'cap-008', location_id: 'loc-003', location_name: 'Site Charlie', timestamp: '2026-04-02T06:25:00Z', resolution: '1.0m', cloud_coverage: 22, source: 'Sentinel-2A', thumbnail_url: '' },
]

const MOCK_CHANGES: ChangeDetection[] = [
  { id: 'chg-001', location_id: 'loc-003', location_name: 'Site Charlie', severity: 'critical', score: 94, description: 'New construction detected - 3 structures', type: 'construction', detected_at: '2026-04-03T06:30:00Z', status: 'new' },
  { id: 'chg-002', location_id: 'loc-001', location_name: 'Site Alpha', severity: 'high', score: 78, description: 'Vehicle movement pattern change', type: 'movement', detected_at: '2026-04-03T08:15:00Z', status: 'new' },
  { id: 'chg-003', location_id: 'loc-002', location_name: 'Site Bravo', severity: 'medium', score: 45, description: 'Vegetation density decrease 12%', type: 'vegetation', detected_at: '2026-04-02T07:40:00Z', status: 'reviewed' },
  { id: 'chg-004', location_id: 'loc-005', location_name: 'Site Echo', severity: 'low', score: 18, description: 'Minor surface water variation', type: 'environmental', detected_at: '2026-04-03T09:00:00Z', status: 'dismissed' },
  { id: 'chg-005', location_id: 'loc-003', location_name: 'Site Charlie', severity: 'high', score: 82, description: 'Road expansion detected - 2.3km', type: 'infrastructure', detected_at: '2026-04-02T06:25:00Z', status: 'reviewed' },
  { id: 'chg-006', location_id: 'loc-001', location_name: 'Site Alpha', severity: 'medium', score: 52, description: 'Perimeter fence modification', type: 'construction', detected_at: '2026-04-01T08:05:00Z', status: 'reviewed' },
]

const MOCK_SCHEDULES: MonitoringSchedule[] = [
  { id: 'sch-001', location_id: 'loc-001', location_name: 'Site Alpha', frequency: 'daily', resolution: '0.5m', is_active: true, next_capture: '2026-04-04T08:00:00Z', last_capture: '2026-04-03T08:15:00Z', total_captures: 1247 },
  { id: 'sch-002', location_id: 'loc-002', location_name: 'Site Bravo', frequency: 'daily', resolution: '1.0m', is_active: true, next_capture: '2026-04-04T07:30:00Z', last_capture: '2026-04-03T07:45:00Z', total_captures: 892 },
  { id: 'sch-003', location_id: 'loc-003', location_name: 'Site Charlie', frequency: 'hourly', resolution: '0.5m', is_active: true, next_capture: '2026-04-03T10:00:00Z', last_capture: '2026-04-03T09:00:00Z', total_captures: 634 },
  { id: 'sch-004', location_id: 'loc-005', location_name: 'Site Echo', frequency: 'weekly', resolution: '0.5m', is_active: true, next_capture: '2026-04-07T09:00:00Z', last_capture: '2026-04-03T09:00:00Z', total_captures: 1583 },
  { id: 'sch-005', location_id: 'loc-004', location_name: 'Site Delta', frequency: 'monthly', resolution: '1.0m', is_active: false, next_capture: 'N/A', last_capture: '2026-04-01T14:00:00Z', total_captures: 211 },
]

const MOCK_SENTINEL_DATES: SentinelDate[] = [
  { date: '2026-04-03T08:15:00Z', cloud_coverage: 2, quality: 'high' },
  { date: '2026-04-01T08:05:00Z', cloud_coverage: 15, quality: 'medium' },
  { date: '2026-03-29T08:00:00Z', cloud_coverage: 0, quality: 'high' },
  { date: '2026-03-27T07:55:00Z', cloud_coverage: 45, quality: 'low' },
  { date: '2026-03-25T07:50:00Z', cloud_coverage: 5, quality: 'high' },
  { date: '2026-03-23T07:45:00Z', cloud_coverage: 8, quality: 'high' },
  { date: '2026-03-21T07:40:00Z', cloud_coverage: 32, quality: 'medium' },
  { date: '2026-03-19T07:35:00Z', cloud_coverage: 0, quality: 'high' },
  { date: '2026-03-17T07:30:00Z', cloud_coverage: 18, quality: 'medium' },
  { date: '2026-03-15T07:25:00Z', cloud_coverage: 3, quality: 'high' },
]

const MOCK_SYSTEM_STATUS: SystemStatus[] = [
  { service: 'Satellite Uplink', status: 'online', latency: '12ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Sentinel-2A Feed', status: 'online', latency: '45ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Sentinel-2B Feed', status: 'online', latency: '52ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'AI Analysis Engine', status: 'online', latency: '120ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Change Detection', status: 'online', latency: '89ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Mapbox Tile Server', status: 'online', latency: '23ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Data Storage', status: 'online', latency: '8ms', last_check: '2026-04-03T09:00:00Z' },
  { service: 'Alert Pipeline', status: 'degraded', latency: '340ms', last_check: '2026-04-03T09:00:00Z' },
]

const MOCK_ANALYSIS: AnalysisResult = {
  land_use: { urban: 34.2, vegetation: 28.7, water: 12.4, bare_soil: 8.1, agriculture: 11.3, other: 5.3 },
  dominant_type: 'urban',
  vegetation_index: 0.42,
  urban_density: 0.67,
  water_coverage: 12.4,
  change_trend: 'increasing',
  confidence: 94.7,
  analyzed_at: '2026-04-03T09:00:00Z',
}

export const mockAPI = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(400)
    return {
      total_locations: MOCK_LOCATIONS.length,
      monitored_locations: MOCK_LOCATIONS.filter((l) => l.is_monitored).length,
      total_captures: MOCK_LOCATIONS.reduce((s, l) => s + l.capture_count, 0),
      total_changes: MOCK_CHANGES.length,
      high_severity_changes: MOCK_CHANGES.filter((c) => c.severity === 'high' || c.severity === 'critical').length,
      active_alerts: 3,
      system_uptime: '99.97%',
      last_sync: '2026-04-03T09:00:00Z',
    }
  },

  async getLocations(): Promise<Location[]> {
    await delay(300)
    return MOCK_LOCATIONS
  },

  async getCaptures(locationId?: string): Promise<Capture[]> {
    await delay(300)
    if (locationId) return MOCK_CAPTURES.filter((c) => c.location_id === locationId)
    return MOCK_CAPTURES
  },

  async getChanges(locationId?: string): Promise<ChangeDetection[]> {
    await delay(300)
    if (locationId) return MOCK_CHANGES.filter((c) => c.location_id === locationId)
    return MOCK_CHANGES
  },

  async getSchedules(): Promise<MonitoringSchedule[]> {
    await delay(300)
    return MOCK_SCHEDULES
  },

  async getSentinelDates(): Promise<SentinelDate[]> {
    await delay(300)
    return MOCK_SENTINEL_DATES
  },

  async getSystemStatus(): Promise<SystemStatus[]> {
    await delay(300)
    return MOCK_SYSTEM_STATUS
  },

  async getAnalysis(): Promise<AnalysisResult> {
    await delay(400)
    return MOCK_ANALYSIS
  },

  async getRecentActivity(): Promise<Array<{ id: string; type: string; message: string; timestamp: string; severity: string }>> {
    await delay(200)
    return [
      { id: 'act-001', type: 'capture', message: 'Satellite capture completed for Site Alpha', timestamp: '2026-04-03T08:15:00Z', severity: 'info' },
      { id: 'act-002', type: 'alert', message: 'CRITICAL: New construction detected at Site Charlie', timestamp: '2026-04-03T06:30:00Z', severity: 'critical' },
      { id: 'act-003', type: 'change', message: 'High severity change: Vehicle movement at Site Alpha', timestamp: '2026-04-03T08:15:00Z', severity: 'high' },
      { id: 'act-004', type: 'system', message: 'Alert pipeline latency spike detected', timestamp: '2026-04-03T07:00:00Z', severity: 'warning' },
      { id: 'act-005', type: 'capture', message: 'Sentinel-2B pass completed for Site Bravo', timestamp: '2026-04-03T07:45:00Z', severity: 'info' },
      { id: 'act-006', type: 'change', message: 'Medium severity: Vegetation decrease at Site Bravo', timestamp: '2026-04-02T07:40:00Z', severity: 'medium' },
      { id: 'act-007', type: 'system', message: 'Weekly maintenance window completed successfully', timestamp: '2026-04-02T03:00:00Z', severity: 'info' },
      { id: 'act-008', type: 'capture', message: 'High-resolution capture completed for Site Echo', timestamp: '2026-04-03T09:00:00Z', severity: 'info' },
    ]
  },
}
