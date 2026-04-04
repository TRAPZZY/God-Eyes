export interface User {
  id: string
  email: string
  username: string
  full_name: string
  role: 'operator' | 'analyst' | 'admin' | 'superadmin'
}

export interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  is_monitored: boolean
  status: 'active' | 'inactive' | 'alert'
  last_capture: string
  capture_count: number
  created_at: string
}

export interface Capture {
  id: string
  location_id: string
  location_name: string
  timestamp: string
  resolution: string
  cloud_coverage: number
  source: string
  thumbnail_url: string
}

export interface ChangeDetection {
  id: string
  location_id: string
  location_name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  score: number
  description: string
  type: string
  detected_at: string
  status: 'new' | 'reviewed' | 'dismissed'
}

export interface MonitoringSchedule {
  id: string
  location_id: string
  location_name: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  resolution: string
  is_active: boolean
  next_capture: string
  last_capture: string
  total_captures: number
}

export interface AlertRule {
  id: string
  name: string
  location_id: string
  location_name: string
  rule_type: string
  is_active: boolean
  triggered_count: number
  last_triggered: string
}

export interface DashboardStats {
  total_locations: number
  monitored_locations: number
  total_captures: number
  total_changes: number
  high_severity_changes: number
  active_alerts: number
  system_uptime: string
  last_sync: string
}

export interface AnalysisResult {
  land_use: Record<string, number>
  dominant_type: string
  vegetation_index: number
  urban_density: number
  water_coverage: number
  change_trend: 'increasing' | 'stable' | 'decreasing'
  confidence: number
  analyzed_at: string
}

export interface SentinelDate {
  date: string
  cloud_coverage: number
  quality: 'high' | 'medium' | 'low'
}

export interface SystemStatus {
  service: string
  status: 'online' | 'degraded' | 'offline'
  latency: string
  last_check: string
}
