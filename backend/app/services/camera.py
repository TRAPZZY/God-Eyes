"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Camera Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Webcam aggregation API integration for discovering and
fetching live camera feeds near monitored locations.
Supports OpenWeatherMap weather cameras and public webcam APIs.
"""

import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.config import get_settings
from app.services.geofencing import haversine_distance

settings = get_settings()

WINDY_CAMERAS_URL = "https://api.windy.com/api/webcams/v2/list"


def get_webcams_nearby(
    latitude: float,
    longitude: float,
    radius_km: int = 50,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Discover public webcams near a given coordinate using multiple sources.

    Args:
        latitude: Center latitude
        longitude: Center longitude
        radius_km: Search radius in kilometers
        limit: Maximum number of results

    Returns:
        List of webcam metadata dictionaries
    """
    all_cameras = []

    owm_cameras = _get_openweather_cameras(latitude, longitude, radius_km)
    all_cameras.extend(owm_cameras)

    windy_cameras = _get_windy_cameras(latitude, longitude, radius_km, limit)
    all_cameras.extend(windy_cameras)

    seen_ids = set()
    unique_cameras = []
    for cam in all_cameras:
        cam_id = cam.get("id") or cam.get("source_id")
        if cam_id and cam_id not in seen_ids:
            seen_ids.add(cam_id)
            unique_cameras.append(cam)

    unique_cameras.sort(key=lambda c: c.get("distance_km", 999999))

    return unique_cameras[:limit]


def _get_openweather_cameras(
    latitude: float,
    longitude: float,
    radius_km: int,
) -> List[Dict[str, Any]]:
    """Fetch weather cameras from OpenWeatherMap."""
    api_key = settings.OPENWEATHER_API_KEY
    if not api_key:
        return []

    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "radius": radius_km * 1000,
            "appid": api_key,
        }
        resp = requests.get(
            "https://api.openweathermap.org/data/2.5/weathercam",
            params=params,
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            cameras = []
            for cam in data.get("result", []):
                coords = cam.get("geometry", {}).get("coordinates", [0, 0])
                cameras.append({
                    "id": cam.get("id"),
                    "source": "openweathermap",
                    "name": cam.get("name", "Unknown Camera"),
                    "latitude": coords[1] if len(coords) > 1 else None,
                    "longitude": coords[0] if len(coords) > 0 else None,
                    "image_url": cam.get("image", ""),
                    "preview_url": cam.get("preview", ""),
                    "status": cam.get("status"),
                    "distance_km": round(cam.get("distance", 0) / 1000, 2),
                })
            return cameras
    except (requests.RequestException, KeyError, ValueError):
        pass

    return []


def _get_windy_cameras(
    latitude: float,
    longitude: float,
    radius_km: int,
    limit: int,
) -> List[Dict[str, Any]]:
    """Fetch webcams from Windy API."""
    try:
        params = {
            "lat": latitude,
            "lon": longitude,
            "range": radius_km * 1000,
            "limit": limit,
            "lang": "en",
        }
        resp = requests.get(WINDY_CAMERAS_URL, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ok":
                cameras = []
                for cam in data.get("result", {}).get("webcams", []):
                    cameras.append({
                        "id": cam.get("id"),
                        "source": "windy",
                        "name": cam.get("title", "Unknown Camera"),
                        "latitude": cam.get("location", {}).get("latitude"),
                        "longitude": cam.get("location", {}).get("longitude"),
                        "image_url": cam.get("image", {}).get("current", {}).get("preview", ""),
                        "preview_url": cam.get("image", {}).get("current", {}).get("preview", ""),
                        "player_url": cam.get("player", {}).get("live", {}).get("available", False),
                        "status": "active" if cam.get("status") == "active" else "inactive",
                        "distance_km": round(
                            haversine_distance(
                                latitude, longitude,
                                cam.get("location", {}).get("latitude", 0),
                                cam.get("location", {}).get("longitude", 0),
                            ),
                            2,
                        ),
                    })
                return cameras
    except (requests.RequestException, KeyError, ValueError):
        pass

    return []


def get_camera_image(
    camera_id: str,
    source: str = "openweathermap",
) -> Optional[bytes]:
    """
    Fetch the latest image from a webcam.

    Args:
        camera_id: Camera identifier
        source: Camera source (openweathermap, windy)

    Returns:
        Raw image bytes, or None on failure
    """
    try:
        if source == "openweathermap":
            api_key = settings.OPENWEATHER_API_KEY
            if not api_key:
                return None
            resp = requests.get(
                f"https://api.openweathermap.org/data/2.5/weathercam/{camera_id}",
                params={"appid": api_key},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                image_url = data.get("result", {}).get("image", "")
                if image_url:
                    img_resp = requests.get(image_url, timeout=10)
                    if img_resp.status_code == 200:
                        return img_resp.content
        elif source == "windy":
            resp = requests.get(
                f"https://api.windy.com/api/webcams/v2/info",
                params={"id": camera_id, "lang": "en"},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "ok":
                    webcam = data.get("result", {}).get("webcams", [{}])[0]
                    image_url = webcam.get("image", {}).get("current", {}).get("preview", "")
                    if image_url:
                        img_resp = requests.get(image_url, timeout=10)
                        if img_resp.status_code == 200:
                            return img_resp.content
    except (requests.RequestException, KeyError, ValueError):
        pass

    return None


def get_camera_history(
    camera_id: str,
    source: str = "windy",
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Fetch historical images from a webcam.

    Args:
        camera_id: Camera identifier
        source: Camera source
        limit: Maximum number of historical images

    Returns:
        List of historical image metadata
    """
    try:
        if source == "windy":
            resp = requests.get(
                f"https://api.windy.com/api/webcams/v2/info",
                params={"id": camera_id, "lang": "en", "show": "timelapse"},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "ok":
                    webcam = data.get("result", {}).get("webcams", [{}])[0]
                    timelapse = webcam.get("timelapse", {})
                    return [
                        {
                            "url": timelapse.get("day", {}).get("embed", ""),
                            "period": "day",
                        },
                        {
                            "url": timelapse.get("month", {}).get("embed", ""),
                            "period": "month",
                        },
                        {
                            "url": timelapse.get("year", {}).get("embed", ""),
                            "period": "year",
                        },
                    ]
    except (requests.RequestException, KeyError, ValueError):
        pass

    return []
