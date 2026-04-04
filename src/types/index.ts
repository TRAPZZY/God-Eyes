export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  role: 'operator' | 'analyst' | 'admin' | 'superadmin'
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface Location {
  id: string
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
  geofences?: Geofence[]
}

export interface Capture {
  id: string
  location_id: string
  image_url: string | null
  image_path: string | null
  resolution: string
  source: string
  width: number | null
  height: number | null
  zoom_level: number | null
  captured_at: string
  cloud_coverage: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ChangeDetection {
  id: string
  location_id: string
  before_capture_id: string
  after_capture_id: string
  change_score: number
  change_type: Record<string, unknown> | null
  severity: 'low' | 'medium' | 'high'
  description: string | null
  diff_image_path: string | null
  detected_at: string
  alert_sent: boolean
  reviewed: boolean
}

export interface MonitoringSchedule {
  id: string
  location_id: string
  location_name?: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  capture_resolution: string
  capture_style: string
  next_capture_at: string | null
  last_capture_at: string | null
  total_captures: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface AlertRule {
  id: string
  user_id: string
  location_id: string
  rule_type: string
  name: string
  conditions: Record<string, unknown> | null
  threshold: number | null
  notification_channel: 'email' | 'webhook' | 'push'
  notification_target: string | null
  is_active: boolean
  triggered_count: number
  last_triggered_at: string | null
  created_at: string
  updated_at: string | null
}

export interface DashboardStats {
  total_locations: number
  monitored_locations: number
  total_captures: number
  total_changes: number
  high_severity_changes: number
}

export interface Geofence {
  id: string
  location_id: string
  name: string
  coordinates: string
  alert_on_change: boolean
  is_active: boolean
  created_at: string
}

export interface WeatherData {
  temperature: number
  feels_like: number
  humidity: number
  pressure: number
  wind_speed: number
  weather_main: string
  weather_description: string
  weather_icon: string
  cloudiness?: number
  visibility?: number
  sunrise?: string
  sunset?: string
  name?: string
  country?: string
  timestamp: string
}

export interface ForecastEntry {
  datetime: string
  temperature: number
  feels_like: number
  humidity: number
  wind_speed: number
  cloudiness: number
  weather_main: string
  weather_description: string
  weather_icon: string
  pop: number
}

export interface CameraFeed {
  id: string
  source: string
  name: string
  latitude: number | null
  longitude: number | null
  image_url: string
  preview_url: string
  status: string
  distance_km: number
}

export interface BatchImportResult {
  status: string
  total_rows: number
  valid_rows: number
  imported: number
  failed: number
  geocoded: number
  parse_errors: Record<string, unknown>[]
  import_errors: Record<string, unknown>[]
  duration_seconds: number
  locations: { id: string; name: string; latitude: number; longitude: number }[]
}

export interface LandUseResult {
  land_use: {
    water: number
    vegetation: number
    urban: number
    bare_soil: number
    snow_ice: number
    unclassified: number
  }
  dominant_type: string
  dominant_percentage: number
  analyzed_at: string
}

export interface ObjectDetectionResult {
  detected_objects: Record<string, unknown>[]
  object_count: number
  image_properties: Record<string, unknown>
  analyzed_at: string
}

export interface ImageQualityResult {
  quality_score: number
  quality_rating: string
  metrics: { brightness: number; contrast: number; sharpness: number }
  issues: { blurry: boolean; overexposed: boolean; underexposed: boolean; low_contrast: boolean }
  analyzed_at: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
