import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
}

export const locationAPI = {
  list: (params?: { skip?: number; limit?: number; monitored_only?: boolean }) =>
    api.get('/locations/', { params }),
  get: (id: string) => api.get(`/locations/${id}`),
  create: (data: { name: string; latitude: number; longitude: number; address?: string; zoom_level?: number }) =>
    api.post('/locations/', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  geocode: (address: string) => api.get('/locations/geocode', { params: { address } }),
  autocomplete: (q: string, limit = 5) => api.get('/locations/search/autocomplete', { params: { q, limit } }),
  getCaptures: (id: string) => api.get(`/locations/${id}/captures`),
  reverseGeocode: (id: string) => api.get(`/locations/${id}/reverse-geocode`),
  createGeofence: (locationId: string, data: { name: string; coordinates: string; alert_on_change?: boolean }) =>
    api.post(`/locations/${locationId}/geofences`, data),
  createAnnotation: (locationId: string, data: { coordinates: string; note?: string; annotation_type?: string }) =>
    api.post(`/locations/${locationId}/annotations`, data),
  getGeofenceCoverage: (locationId: string) =>
    api.get(`/geofencing/coverage/${locationId}`),
  createCircularGeofence: (locationId: string, data: { latitude: number; longitude: number; radius_km: number; name: string; alert_on_change?: boolean; num_points?: number }) =>
    api.post('/geofencing/circular-geofence', null, { params: { location_id: locationId, ...data } }),
  checkPoint: (locationId: string, latitude: number, longitude: number) =>
    api.post('/geofencing/check-point', null, { params: { location_id: locationId, latitude, longitude } }),
  calculateDistance: (locationId: string, lat1: number, lon1: number, lat2: number, lon2: number) =>
    api.get(`/geofencing/distance/${locationId}`, { params: { lat1, lon1, lat2, lon2 } }),
  deleteGeofence: (geofenceId: string) =>
    api.delete(`/geofencing/${geofenceId}`),
  updateGeofence: (geofenceId: string, data: { name?: string; alert_on_change?: boolean; is_active?: boolean }) =>
    api.put(`/geofencing/${geofenceId}`, null, { params: data }),
}

export const captureAPI = {
  create: (data: { location_id: string; resolution?: string; style?: string }) =>
    api.post('/captures/', data),
  get: (id: string) => api.get(`/captures/${id}`),
  download: (id: string) => api.get(`/captures/${id}/download`, { responseType: 'blob' }),
  getHistory: (locationId: string, params?: { page?: number; per_page?: number }) =>
    api.get(`/captures/location/${locationId}/history`, { params }),
  getChanges: (locationId: string, severity?: string) =>
    api.get(`/captures/location/${locationId}/changes`, { params: { severity } }),
  delete: (id: string) => api.delete(`/captures/${id}`),
  getStaticMapUrl: (params: { longitude: number; latitude: number; zoom?: number; style?: string; resolution?: string }) =>
    api.get('/captures/static-map-url', { params }),
}

export const monitoringAPI = {
  listSchedules: (active_only = false) => api.get('/monitoring/schedules', { params: { active_only } }),
  createSchedule: (data: { location_id: string; frequency?: string; capture_resolution?: string; capture_style?: string }) =>
    api.post('/monitoring/schedules', data),
  updateSchedule: (id: string, data: Record<string, unknown>) =>
    api.put(`/monitoring/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`/monitoring/schedules/${id}`),
  triggerCapture: (scheduleId: string) =>
    api.post(`/monitoring/schedules/${scheduleId}/trigger`),
  listAlerts: (active_only = false) => api.get('/monitoring/alerts', { params: { active_only } }),
  createAlert: (data: { location_id: string; rule_type: string; name: string; notification_channel: string; notification_target: string }) =>
    api.post('/monitoring/alerts', data),
  updateAlert: (id: string, data: Record<string, unknown>) =>
    api.put(`/monitoring/alerts/${id}`, data),
  deleteAlert: (id: string) => api.delete(`/monitoring/alerts/${id}`),
}

export const analysisAPI = {
  compare: (before_capture_id: string, after_capture_id: string) =>
    api.post('/analysis/compare', null, { params: { before_capture_id, after_capture_id } }),
  getSummary: (locationId: string) => api.get(`/analysis/summary/${locationId}`),
  getSentinelDates: (locationId: string, params?: { start_date?: string; end_date?: string; max_cloud_coverage?: number }) =>
    api.get(`/analysis/sentinel-dates/${locationId}`, { params }),
  triggerSentinel: (locationId: string, date?: string) =>
    api.post(`/analysis/sentinel-capture/${locationId}`, null, { params: { date } }),
  getNDVI: (locationId: string, date?: string) =>
    api.get(`/analysis/ndvi/${locationId}`, { params: { date }, responseType: 'blob' }),
  getDiffImage: (changeId: string) =>
    api.get(`/analysis/diff/${changeId}`, { responseType: 'blob' }),
  getDashboardStats: () => api.get('/analysis/dashboard-stats'),
  getMonitoringStatus: () => api.get('/analysis/monitoring/status'),
}

export const weatherAPI = {
  getCurrent: (locationId: string) =>
    api.get(`/intelligence/weather/current/${locationId}`),
  getForecast: (locationId: string, days = 5) =>
    api.get(`/intelligence/weather/forecast/${locationId}`, { params: { days } }),
  getUV: (locationId: string) =>
    api.get(`/intelligence/weather/uv/${locationId}`),
  getAirQuality: (locationId: string) =>
    api.get(`/intelligence/weather/air-quality/${locationId}`),
  getWeatherCameras: (locationId: string, radiusKm = 50) =>
    api.get(`/intelligence/weather/cameras/${locationId}`, { params: { radius_km: radiusKm } }),
}

export const cameraAPI = {
  getCameras: (locationId: string, radiusKm = 50, limit = 20) =>
    api.get(`/intelligence/cameras/${locationId}`, { params: { radius_km: radiusKm, limit } }),
  getCameraImage: (cameraId: string, source = 'openweathermap') =>
    api.get(`/intelligence/cameras/${cameraId}/image`, { params: { source }, responseType: 'blob' }),
  getCameraHistory: (cameraId: string, source = 'windy') =>
    api.get(`/intelligence/cameras/${cameraId}/history`, { params: { source } }),
}

export const batchAPI = {
  importCSV: (file: File, skipGeocoding = false) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/batch/import', formData, {
      params: { skip_geocoding: skipGeocoding },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  downloadTemplate: () =>
    api.get('/intelligence/batch/template', { responseType: 'blob' }),
  validateCSV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/batch/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const exportAPI = {
  exportGeoJSON: (locationIds?: string[], includeGeofences = true) =>
    api.get('/intelligence/export/geojson', {
      params: { location_ids: locationIds?.join(','), include_geofences: includeGeofences },
      responseType: 'blob',
    }),
  importGeoJSON: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/import/geojson', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportKML: (locationIds?: string[], includeGeofences = true) =>
    api.get('/intelligence/export/kml', {
      params: { location_ids: locationIds?.join(','), include_geofences: includeGeofences },
      responseType: 'blob',
    }),
  importKML: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/import/kml', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportGPX: (locationIds?: string[]) =>
    api.get('/intelligence/export/gpx', {
      params: { location_ids: locationIds?.join(',') },
      responseType: 'blob',
    }),
  importGPX: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/import/gpx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  autoDetectImport: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/intelligence/import/auto-detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const aiAPI = {
  analyzeLandUse: (params: { location_id?: string; capture_id?: string }) =>
    api.post('/intelligence/ai/land-use', null, { params }),
  detectObjects: (params: { location_id?: string; capture_id?: string }) =>
    api.post('/intelligence/ai/object-detection', null, { params }),
  analyzeQuality: (params: { location_id?: string; capture_id?: string }) =>
    api.post('/intelligence/ai/image-quality', null, { params }),
  analyzeVegetation: (params: { location_id?: string; capture_id?: string }) =>
    api.post('/intelligence/ai/vegetation-index', null, { params }),
}

export const timelapseAPI = {
  generate: (data: { location_id: string; style?: string; fps?: number; duration_days?: number }) =>
    api.post('/intelligence/timelapse/generate', null, {
      params: {
        location_id: data.location_id,
        style: data.style || 'gif',
        fps: data.fps || 5,
        duration_days: data.duration_days || 30,
      },
    }),
}

export const reportAPI = {
  generate: (data: { location_id: string; format?: string; date_range?: string }) =>
    api.get(`/intelligence/report/${data.location_id}`, {
      params: {
        format: data.format || 'html',
        date_range: data.date_range,
      },
    }),
}

export const heatmapAPI = {
  generate: (locationId: string, params?: { width?: number; height?: number; radius?: number; days?: number }) =>
    api.get(`/intelligence/heatmap/${locationId}`, {
      params: {
        width: params?.width || 800,
        height: params?.height || 600,
        radius: params?.radius || 40,
        days: params?.days || 90,
      },
    }),
}

export default api
