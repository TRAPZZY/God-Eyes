"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Weather Service

Creator: Trapzzy
Contact: traphubs@outlook.com

OpenWeatherMap integration for current weather conditions,
multi-day forecasts, and weather camera discovery.
"""

import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.config import get_settings

settings = get_settings()

OWM_BASE_URL = "https://api.openweathermap.org/data/2.5"
OWM_WEATHER_CAMERAS_URL = "https://api.openweathermap.org/data/2.5/weathercam"


def _get_api_key() -> Optional[str]:
    """Retrieve the OpenWeatherMap API key from settings."""
    return settings.OPENWEATHER_API_KEY


def _build_params(extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build common request parameters with API key."""
    params = {"appid": _get_api_key() or "", "units": "metric"}
    if extra:
        params.update(extra)
    return params


def get_current_weather(
    latitude: float,
    longitude: float,
) -> Optional[Dict[str, Any]]:
    """
    Fetch current weather conditions for a given coordinate.

    Args:
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        Dictionary with current weather data, or None on failure
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_key,
            "units": "metric",
        }
        resp = requests.get(f"{OWM_BASE_URL}/weather", params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "temp_min": data["main"]["temp_min"],
                "temp_max": data["main"]["temp_max"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "wind_deg": data["wind"].get("deg"),
                "wind_gust": data["wind"].get("gust"),
                "cloudiness": data["clouds"]["all"],
                "visibility": data.get("visibility"),
                "weather_main": data["weather"][0]["main"],
                "weather_description": data["weather"][0]["description"],
                "weather_icon": data["weather"][0]["icon"],
                "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"], tz=timezone.utc).isoformat(),
                "sunset": datetime.fromtimestamp(data["sys"]["sunset"], tz=timezone.utc).isoformat(),
                "name": data.get("name"),
                "country": data["sys"]["country"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None


def get_forecast(
    latitude: float,
    longitude: float,
    days: int = 5,
) -> Optional[Dict[str, Any]]:
    """
    Fetch multi-day weather forecast for a given coordinate.

    Args:
        latitude: Location latitude
        longitude: Location longitude
        days: Number of forecast days (free tier supports 5)

    Returns:
        Dictionary with forecast data, or None on failure
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_key,
            "units": "metric",
            "cnt": min(days * 8, 40),
        }
        resp = requests.get(f"{OWM_BASE_URL}/forecast", params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            forecasts = []
            for item in data.get("list", []):
                forecasts.append({
                    "datetime": item.get("dt_txt"),
                    "temperature": item["main"]["temp"],
                    "feels_like": item["main"]["feels_like"],
                    "humidity": item["main"]["humidity"],
                    "pressure": item["main"]["pressure"],
                    "wind_speed": item["wind"]["speed"],
                    "cloudiness": item["clouds"]["all"],
                    "weather_main": item["weather"][0]["main"],
                    "weather_description": item["weather"][0]["description"],
                    "weather_icon": item["weather"][0]["icon"],
                    "pop": item.get("pop", 0),
                })

            return {
                "location": data.get("city", {}).get("name"),
                "country": data.get("city", {}).get("country"),
                "timezone": data.get("city", {}).get("timezone"),
                "forecast": forecasts,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None


def get_weather_cameras(
    latitude: float,
    longitude: float,
    radius_km: int = 50,
) -> List[Dict[str, Any]]:
    """
    Discover weather cameras near a given coordinate.

    Args:
        latitude: Center latitude
        longitude: Center longitude
        radius_km: Search radius in kilometers

    Returns:
        List of camera metadata dictionaries
    """
    api_key = _get_api_key()
    if not api_key:
        return []

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "radius": radius_km * 1000,
            "appid": api_key,
        }
        resp = requests.get(OWM_WEATHER_CAMERAS_URL, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            cameras = []
            for cam in data.get("result", []):
                cameras.append({
                    "id": cam.get("id"),
                    "name": cam.get("name"),
                    "latitude": cam.get("geometry", {}).get("coordinates", [None, None])[1],
                    "longitude": cam.get("geometry", {}).get("coordinates", [None, None])[0],
                    "image_url": cam.get("image", ""),
                    "preview_url": cam.get("preview", ""),
                    "status": cam.get("status"),
                    "distance_km": round(cam.get("distance", 0) / 1000, 2),
                })
            return cameras
    except (requests.RequestException, KeyError, ValueError):
        pass

    return []


def get_weather_by_city(
    city_name: str,
    country_code: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Fetch current weather for a named city.

    Args:
        city_name: City name
        country_code: Optional ISO 3166 country code

    Returns:
        Dictionary with weather data, or None on failure
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    try:
        q = city_name
        if country_code:
            q = f"{city_name},{country_code}"

        params = {"q": q, "appid": api_key, "units": "metric"}
        resp = requests.get(f"{OWM_BASE_URL}/weather", params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "weather_main": data["weather"][0]["main"],
                "weather_description": data["weather"][0]["description"],
                "weather_icon": data["weather"][0]["icon"],
                "name": data.get("name"),
                "country": data["sys"]["country"],
                "latitude": data["coord"]["lat"],
                "longitude": data["coord"]["lon"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None


def get_uv_index(
    latitude: float,
    longitude: float,
) -> Optional[Dict[str, Any]]:
    """
    Fetch UV index data for a given coordinate.

    Args:
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        Dictionary with UV index data, or None on failure
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_key,
        }
        resp = requests.get(f"{OWM_BASE_URL}/uvi", params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "latitude": data.get("lat"),
                "longitude": data.get("lon"),
                "uv_index": data.get("value"),
                "timestamp": datetime.fromtimestamp(data.get("date", 0), tz=timezone.utc).isoformat() if data.get("date") else None,
            }
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None


def get_air_pollution(
    latitude: float,
    longitude: float,
) -> Optional[Dict[str, Any]]:
    """
    Fetch current air pollution data for a given coordinate.

    Args:
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        Dictionary with air quality data, or None on failure
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_key,
        }
        resp = requests.get(f"{OWM_BASE_URL}/air_pollution", params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("list"):
                item = data["list"][0]
                return {
                    "aqi": item.get("main", {}).get("aqi"),
                    "components": item.get("components"),
                    "timestamp": datetime.fromtimestamp(item.get("dt", 0), tz=timezone.utc).isoformat(),
                }
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None
