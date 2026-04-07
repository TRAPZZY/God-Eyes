const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const REQUEST_TIMEOUT_MS = 15_000

let refreshPromise: Promise<boolean> | null = null

function getToken(): string | null {
  return localStorage.getItem('godeyes_access_token')
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('godeyes_access_token', access)
  localStorage.setItem('godeyes_refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('godeyes_access_token')
  localStorage.removeItem('godeyes_refresh_token')
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

async function doRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = localStorage.getItem('godeyes_refresh_token')
    if (!refresh) return false
    try {
      const refreshRes = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setTokens(data.access_token, data.refresh_token)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function redirectToLogin() {
  clearTokens()
  window.location.href = '/login'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  const url = `${API_BASE}${normalizePath(path)}`
  const res = await fetchWithTimeout(url, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await doRefreshToken()
    if (refreshed) {
      const newToken = getToken()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetchWithTimeout(url, { ...options, headers })
        if (!retryRes.ok) {
          redirectToLogin()
          throw new Error('Session expired')
        }
        if (retryRes.status === 204) return undefined as T
        return retryRes.json() as Promise<T>
      }
    }
    redirectToLogin()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ============================================================
// Auth
// ============================================================

export async function apiRegister(data: { email: string; username: string; password: string; full_name?: string }) {
  return request<{ id: string; email: string; username: string; role: string; created_at: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify(data) }
  )
}

export async function apiLogin(email: string, password: string) {
  const data = await request<{ access_token: string; refresh_token: string; token_type: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  )
  setTokens(data.access_token, data.refresh_token)
  return data
}

export async function apiGetMe() {
  return request<{ id: string; email: string; username: string; full_name: string | null; role: string; is_active: boolean; created_at: string }>(
    '/auth/me'
  )
}

export function apiLogout() {
  clearTokens()
}

// ============================================================
// Locations
// ============================================================

export interface BackendLocation {
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
}

export async function apiGetLocations(monitoredOnly = false): Promise<BackendLocation[]> {
  const params = monitoredOnly ? '?monitored_only=true' : ''
  return request<BackendLocation[]>(`/locations${params}`)
}

export async function apiCreateLocation(data: {
  name: string
  latitude: number
  longitude: number
  address?: string
  zoom_level?: number
  tags?: string
  notes?: string
}) {
  return request<BackendLocation>('/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiUpdateLocation(id: string, data: Partial<BackendLocation>) {
  return request<BackendLocation>(`/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiDeleteLocation(id: string) {
  return request<void>(`/locations/${id}`, { method: 'DELETE' })
}

export async function apiGetLocationCaptures(id: string) {
  return request<BackendCapture[]>(`/locations/${id}/captures`)
}

// ============================================================
// Captures
// ============================================================

export interface BackendCapture {
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
  image_metadata: Record<string, unknown> | null
  created_at: string
}

export async function apiTriggerCapture(locationId: string, resolution = 'standard', style = 'satellite') {
  return request<BackendCapture>('/captures', {
    method: 'POST',
    body: JSON.stringify({ location_id: locationId, resolution, style }),
  })
}

export async function apiGetCaptures(page = 1, perPage = 20): Promise<{ captures: BackendCapture[]; total: number }> {
  return request<{ captures: BackendCapture[]; total: number }>(`/captures?page=${page}&per_page=${perPage}`)
}

// ============================================================
// Change Detection
// ============================================================

export interface BackendChange {
  id: string
  location_id: string
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

export async function apiGetChanges(): Promise<BackendChange[]> {
  return request<BackendChange[]>('/analysis/changes')
}

// ============================================================
// Monitoring Schedules
// ============================================================

export interface BackendSchedule {
  id: string
  location_id: string
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

export async function apiGetSchedules(): Promise<BackendSchedule[]> {
  return request<BackendSchedule[]>('/monitoring/schedules')
}

export async function apiCreateSchedule(data: {
  location_id: string
  frequency: string
  capture_resolution?: string
  capture_style?: string
}) {
  return request<BackendSchedule>('/monitoring/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ============================================================
// Alert Rules
// ============================================================

export interface BackendAlertRule {
  id: string
  user_id: string
  location_id: string
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

export async function apiGetAlertRules(): Promise<BackendAlertRule[]> {
  return request<BackendAlertRule[]>('/monitoring/alerts')
}

export async function apiCreateAlertRule(data: {
  location_id: string
  rule_type: string
  name: string
  notification_target: string
}) {
  return request<BackendAlertRule>('/monitoring/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ============================================================
// Dashboard Stats (computed from real data)
// ============================================================

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

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const [locations, schedules, changes, alerts, health] = await Promise.all([
    apiGetLocations(),
    apiGetSchedules(),
    apiGetChanges().catch(() => []),
    apiGetAlertRules().catch(() => []),
    apiHealthCheck().catch(() => ({ status: 'unknown', service: 'God Eyes', uptime_seconds: 0 })),
  ])

  const totalCaptures = schedules.reduce((sum, s) => sum + s.total_captures, 0)
  const highSeverity = changes.filter(
    (c) => c.severity === 'high' || c.severity === 'critical'
  ).length

  const monitoredCount = locations.filter((l) => l.is_monitored).length
  const activeSchedules = schedules.filter((s) => s.is_active).length
  const uptimePercent = monitoredCount > 0
    ? ((activeSchedules / monitoredCount) * 100).toFixed(2)
    : '0.00'

  return {
    total_locations: locations.length,
    monitored_locations: monitoredCount,
    total_captures: totalCaptures,
    total_changes: changes.length,
    high_severity_changes: highSeverity,
    active_alerts: alerts.filter((a) => a.is_active).length,
    system_uptime: `${uptimePercent}%`,
    last_sync: health.uptime_seconds ? new Date(Date.now() - health.uptime_seconds * 1000).toISOString() : new Date().toISOString(),
  }
}

// ============================================================
// Analysis
// ============================================================

export interface AnalysisSummary {
  total_changes: number
  changes_by_severity: Record<string, number>
  changes_by_location: Record<string, number>
  average_change_score: number
  last_analysis_at: string | null
}

export async function apiGetAnalysis(locationId?: string): Promise<AnalysisSummary> {
  const params = locationId ? `?location_id=${locationId}` : ''
  return request<AnalysisSummary>(`/analysis/summary${params}`)
}

export type SentinelQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

export interface SentinelDateEntry {
  date: string
  cloud_coverage: number
  quality: SentinelQuality
}

export async function apiGetSentinelDates(locationId?: string): Promise<SentinelDateEntry[]> {
  const params = locationId ? `?location_id=${locationId}` : ''
  return request<SentinelDateEntry[]>(
    `/analysis/sentinel-dates${params}`
  )
}

// ============================================================
// Intelligence
// ============================================================

export async function apiGetTimelapse(locationId: string) {
  return request<{ timelapse_url: string }>(`/intelligence/timelapse?location_id=${locationId}`)
}

export async function apiGetHeatmap(locationId: string) {
  return request<{ heatmap_url: string }>(`/intelligence/heatmap?location_id=${locationId}`)
}

export async function apiGenerateReport(locationId: string) {
  return request<{ report_url: string }>(`/intelligence/report?location_id=${locationId}`)
}

// ============================================================
// System Health
// ============================================================

export async function apiHealthCheck() {
  return request<{ status: string; service: string; uptime_seconds?: number }>('/health', {
    headers: { 'Content-Type': 'application/json' },
  })
}
