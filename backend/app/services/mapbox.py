"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Mapbox Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Handles all Mapbox API interactions including satellite image retrieval,
static map generation, and style switching. Supports multiple resolution tiers.
Integrated with LRU cache for transparent response caching.
"""

import requests
import os
from typing import Optional
from app.config import get_settings
from app.core.cache import get_cache

settings = get_settings()
cache = get_cache()

STYLE_MAP = {
    "satellite": "mapbox/satellite-v9",
    "hybrid": "mapbox/satellite-streets-v12",
    "terrain": "mapbox/outdoors-v12",
    "streets": "mapbox/streets-v12",
}

RESOLUTION_MAP = {
    "standard": (640, 480),
    "high": (1280, 960),
    "ultra": (1920, 1080),
    "8k": (1920, 1080),
}


def get_static_map_url(
    longitude: float,
    latitude: float,
    zoom: float = 15.0,
    style: str = "satellite",
    resolution: str = "standard",
    width: Optional[int] = None,
    height: Optional[int] = None,
    bearing: float = 0.0,
    pitch: float = 0.0,
) -> str:
    style_id = STYLE_MAP.get(style, STYLE_MAP["satellite"])
    if width is None or height is None:
        width, height = RESOLUTION_MAP.get(resolution, RESOLUTION_MAP["standard"])
    base_url = f"https://api.mapbox.com/styles/v1/{style_id}/static/"
    url = f"{base_url}{longitude},{latitude},{zoom},{bearing},{pitch}/{width}x{height}?access_token={settings.MAPBOX_ACCESS_TOKEN}"
    return url


def fetch_static_map(
    longitude: float,
    latitude: float,
    zoom: float = 15.0,
    style: str = "satellite",
    resolution: str = "standard",
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> bytes:
    cache_key = f"mapbox_img_{longitude}_{latitude}_{zoom}_{style}_{resolution}_{width}_{height}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = get_static_map_url(longitude, latitude, zoom, style, resolution, width, height)
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    content = response.content

    cache.set(cache_key, content, ttl=3600)
    return content


def fetch_static_map_with_overlay(
    longitude: float,
    latitude: float,
    zoom: float = 15.0,
    style: str = "satellite",
    resolution: str = "standard",
    markers: Optional[list[dict]] = None,
    geojson: Optional[dict] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> bytes:
    style_id = STYLE_MAP.get(style, STYLE_MAP["satellite"])
    if width is None or height is None:
        width, height = RESOLUTION_MAP.get(resolution, RESOLUTION_MAP["standard"])
    base_url = f"https://api.mapbox.com/styles/v1/{style_id}/static/"
    overlays = []
    if markers:
        for marker in markers:
            m_lon = marker.get("longitude", longitude)
            m_lat = marker.get("latitude", latitude)
            m_label = marker.get("label", "")
            m_color = marker.get("color", "000")
            overlays.append(f"pin-s-{m_label}+{m_color}({m_lon},{m_lat})")
    overlay_str = ",".join(overlays) if overlays else "auto"
    url = f"{base_url}{overlay_str}/{longitude},{latitude},{zoom},0,0/{width}x{height}?access_token={settings.MAPBOX_ACCESS_TOKEN}"
    if geojson:
        import json
        geojson_str = json.dumps(geojson)
        url += f"&geojson={geojson_str}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content
