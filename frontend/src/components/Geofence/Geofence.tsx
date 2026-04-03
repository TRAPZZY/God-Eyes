import { useState, useEffect, useCallback } from 'react'
import { MapPin, Trash2, Eye, EyeOff, Plus, Circle, Pentagon, AlertTriangle, CheckCircle, X, Ruler, Maximize2, Info } from 'lucide-react'
import { locationAPI } from '../../services/api'
import type { Location, Geofence } from '../../types'

export default function Geofence() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [coverage, setCoverage] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createMode, setCreateMode] = useState<'circular' | 'manual'>('circular')
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    radius_km: 1,
    alert_on_change: true,
  })
  const [pointCheck, setPointCheck] = useState({ lat: '', lon: '' })
  const [pointResult, setPointResult] = useState<Record<string, unknown> | null>(null)
  const [distancePoints, setDistancePoints] = useState({ lat1: '', lon1: '', lat2: '', lon2: '' })
  const [distanceResult, setDistanceResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      loadGeofences(selectedLocation)
      loadCoverage(selectedLocation)
    }
  }, [selectedLocation])

  const loadLocations = async () => {
    try {
      const { data } = await locationAPI.list({ limit: 100 })
      setLocations(data)
      if (data.length > 0 && !selectedLocation) setSelectedLocation(data[0].id)
    } catch {
      console.error('Failed to load locations')
    }
  }

  const loadGeofences = async (locId: string) => {
    try {
      const loc = locations.find(l => l.id === locId)
      if (loc && loc.geofences) {
        setGeofences(loc.geofences)
      } else {
        setGeofences([])
      }
    } catch {
      setGeofences([])
    }
  }

  const loadCoverage = async (locId: string) => {
    setLoading(true)
    try {
      const { data } = await locationAPI.getGeofenceCoverage(locId)
      setCoverage(data)
    } catch {
      setCoverage(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGeofence = async () => {
    if (!selectedLocation || !newGeofence.name.trim()) return
    try {
      if (createMode === 'circular') {
        await locationAPI.createCircularGeofence(selectedLocation, {
          latitude: newGeofence.latitude || locations.find(l => l.id === selectedLocation)?.latitude || 0,
          longitude: newGeofence.longitude || locations.find(l => l.id === selectedLocation)?.longitude || 0,
          radius_km: newGeofence.radius_km,
          name: newGeofence.name,
          alert_on_change: newGeofence.alert_on_change,
        })
      }
      setShowCreateModal(false)
      setNewGeofence({ name: '', latitude: 0, longitude: 0, radius_km: 1, alert_on_change: true })
      loadGeofences(selectedLocation)
      loadCoverage(selectedLocation)
    } catch (err) {
      console.error('Failed to create geofence:', err)
    }
  }

  const handleDeleteGeofence = async (geofenceId: string) => {
    try {
      await locationAPI.deleteGeofence(geofenceId)
      loadGeofences(selectedLocation)
      loadCoverage(selectedLocation)
    } catch {
      console.error('Failed to delete geofence')
    }
  }

  const handleToggleGeofence = async (geofenceId: string, currentActive: boolean) => {
    try {
      await locationAPI.updateGeofence(geofenceId, { is_active: !currentActive })
      loadGeofences(selectedLocation)
    } catch {
      console.error('Failed to toggle geofence')
    }
  }

  const handleCheckPoint = async () => {
    if (!selectedLocation || !pointCheck.lat || !pointCheck.lon) return
    try {
      const { data } = await locationAPI.checkPoint(selectedLocation, parseFloat(pointCheck.lat), parseFloat(pointCheck.lon))
      setPointResult(data)
    } catch {
      setPointResult(null)
    }
  }

  const handleCalculateDistance = async () => {
    if (!selectedLocation || !distancePoints.lat1 || !distancePoints.lon1 || !distancePoints.lat2 || !distancePoints.lon2) return
    try {
      const { data } = await locationAPI.calculateDistance(
        selectedLocation,
        parseFloat(distancePoints.lat1),
        parseFloat(distancePoints.lon1),
        parseFloat(distancePoints.lat2),
        parseFloat(distancePoints.lon2),
      )
      setDistanceResult(data)
    } catch {
      setDistanceResult(null)
    }
  }

  const selectedLoc = locations.find(l => l.id === selectedLocation)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Geofencing</h1>
          <p className="text-gray-400">Perimeter-based monitoring and spatial analysis</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedLocation}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Geofence
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-300">Location:</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-4 py-2 bg-input border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        {selectedLoc && (
          <span className="text-sm text-gray-400">
            {selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}
          </span>
        )}
      </div>

      {coverage && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Pentagon className="w-6 h-6" />}
            label="Active Geofences"
            value={coverage.active_geofences as number || 0}
            color="text-blue-400"
          />
          <StatCard
            icon={<Maximize2 className="w-6 h-6" />}
            label="Total Area (km²)"
            value={coverage.total_area_km2 as number || 0}
            color="text-green-400"
            decimals={2}
          />
          <StatCard
            icon={<Ruler className="w-6 h-6" />}
            label="Perimeter (km)"
            value={coverage.total_perimeter_km as number || 0}
            color="text-purple-400"
            decimals={2}
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Alert-Enabled"
            value={(coverage.geofences as any[])?.filter((g: any) => g.alert_on_change).length || 0}
            color="text-yellow-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Pentagon className="w-5 h-5 text-primary" />
            Active Geofences
          </h2>
          {geofences.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No geofences configured. Create one to start perimeter monitoring.</p>
          ) : (
            <div className="space-y-3">
              {geofences.map((gf: Geofence) => (
                <div key={gf.id} className="flex items-center justify-between p-3 bg-input rounded-lg border border-gray-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{gf.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        gf.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {gf.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {gf.alert_on_change && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Alerts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(gf.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleGeofence(gf.id, gf.is_active)}
                      className="p-1.5 rounded hover:bg-gray-600 transition-colors"
                      title={gf.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {gf.is_active ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleDeleteGeofence(gf.id)}
                      className="p-1.5 rounded hover:bg-red-600/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Point-in-Geofence Check
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={pointCheck.lat}
                onChange={(e) => setPointCheck(prev => ({ ...prev, lat: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={pointCheck.lon}
                onChange={(e) => setPointCheck(prev => ({ ...prev, lon: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={handleCheckPoint}
              disabled={!pointCheck.lat || !pointCheck.lon}
              className="w-full px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm disabled:opacity-50"
            >
              Check Point
            </button>
            {pointResult && (
              <div className="mt-3 p-3 bg-input rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {(pointResult.inside_any as boolean) ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium">
                    {(pointResult.inside_any as boolean) ? 'Inside geofence' : 'Outside all geofences'}
                  </span>
                </div>
                {(pointResult.geofences as any[])?.map((gf: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-400 py-1">
                    <span>{gf.geofence_name}</span>
                    <span className={gf.is_inside ? 'text-green-400' : 'text-red-400'}>
                      {gf.is_inside ? 'Inside' : `${gf.distance_to_boundary_km} km away`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              Distance Calculator
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <input
                type="number"
                step="any"
                placeholder="Lat A"
                value={distancePoints.lat1}
                onChange={(e) => setDistancePoints(prev => ({ ...prev, lat1: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                placeholder="Lon A"
                value={distancePoints.lon1}
                onChange={(e) => setDistancePoints(prev => ({ ...prev, lon1: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                placeholder="Lat B"
                value={distancePoints.lat2}
                onChange={(e) => setDistancePoints(prev => ({ ...prev, lat2: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                placeholder="Lon B"
                value={distancePoints.lon2}
                onChange={(e) => setDistancePoints(prev => ({ ...prev, lon2: e.target.value }))}
                className="px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={handleCalculateDistance}
              disabled={!distancePoints.lat1 || !distancePoints.lon1 || !distancePoints.lat2 || !distancePoints.lon2}
              className="w-full px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm disabled:opacity-50"
            >
              Calculate Distance
            </button>
            {distanceResult && (
              <div className="mt-3 p-3 bg-input rounded-lg space-y-1 text-sm">
                <p className="text-white font-medium">
                  Distance: {(distanceResult.distance_km as number)?.toFixed(2)} km
                </p>
                <p className="text-gray-400">
                  {(distanceResult.distance_miles as number)?.toFixed(2)} miles | {(distanceResult.distance_meters as number)?.toFixed(0)} meters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create Geofence</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCreateMode('circular')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                  createMode === 'circular' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-input text-gray-400'
                }`}
              >
                <Circle className="w-4 h-4" />
                Circular
              </button>
              <button
                onClick={() => setCreateMode('manual')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                  createMode === 'manual' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-input text-gray-400'
                }`}
              >
                <Pentagon className="w-4 h-4" />
                Manual
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newGeofence.name}
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Geofence name"
                  className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {createMode === 'circular' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newGeofence.latitude || selectedLoc?.latitude || ''}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Lat"
                        className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newGeofence.longitude || selectedLoc?.longitude || ''}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Lon"
                        className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={newGeofence.radius_km}
                      onChange={(e) => setNewGeofence(prev => ({ ...prev, radius_km: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {createMode === 'manual' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Info className="w-4 h-4" />
                    <span>Draw the perimeter directly on the map in the Monitor view</span>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={newGeofence.alert_on_change}
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, alert_on_change: e.target.checked }))}
                  className="rounded border-gray-600 bg-input text-primary focus:ring-primary"
                />
                Alert on change detection
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-input text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGeofence}
                disabled={!newGeofence.name.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, decimals }: { icon: React.ReactNode; label: string; value: number; color: string; decimals?: number }) {
  return (
    <div className="bg-card rounded-xl border border-gray-700 p-6">
      <div className={color}>{icon}</div>
      <p className="text-3xl font-bold mt-4">
        {decimals ? value.toFixed(decimals) : value}
      </p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}
