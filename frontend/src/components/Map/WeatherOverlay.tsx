import { useEffect, useState } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Loader } from 'lucide-react'
import { weatherAPI } from '../../services/api'
import type { WeatherData } from '../../types'

interface WeatherOverlayProps {
  locationId: string
}

export default function WeatherOverlay({ locationId }: WeatherOverlayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!locationId) return
    loadWeather()
  }, [locationId])

  const loadWeather = async () => {
    try {
      const { data } = await weatherAPI.getCurrent(locationId)
      setWeather(data)
    } catch {
      console.error('Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3">
        <Loader className="w-4 h-4 animate-spin text-primary" />
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const weatherIconUrl = `https://openweathermap.org/img/wn/${weather.weather_icon}@2x.png`

  return (
    <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <img src={weatherIconUrl} alt={weather.weather_description} className="w-8 h-8" />
        <div>
          <p className="text-lg font-bold">{Math.round(weather.temperature)}°C</p>
          <p className="text-xs text-gray-400 capitalize">{weather.weather_description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-gray-300">
          <Thermometer className="w-3 h-3 text-orange-400" />
          <span>Feels {Math.round(weather.feels_like)}°</span>
        </div>
        <div className="flex items-center gap-1 text-gray-300">
          <Droplets className="w-3 h-3 text-blue-400" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-gray-300">
          <Wind className="w-3 h-3 text-cyan-400" />
          <span>{weather.wind_speed} m/s</span>
        </div>
        <div className="flex items-center gap-1 text-gray-300">
          <Cloud className="w-3 h-3 text-gray-400" />
          <span>{weather.cloudiness ?? '--'}%</span>
        </div>
      </div>
    </div>
  )
}
