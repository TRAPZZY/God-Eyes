"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Sentinel Hub Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Integrates with ESA's Sentinel Hub (Copernicus Sentinel-2) for free high-resolution
satellite imagery with historical archive access, multispectral analysis, and NDVI computation.
Provides change detection baseline data with ~5-day revisit time.
"""

import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from app.config import get_settings

settings = get_settings()

SENTINEL_HUB_AUTH_URL = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"
SENTINEL_HUB_PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process"
SENTINEL_HUB_CATALOG_URL = "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search"


def _get_auth_token() -> Optional[str]:
    if not settings.SENTINEL_HUB_CLIENT_ID or not settings.SENTINEL_HUB_CLIENT_SECRET:
        return None
    response = requests.post(
        SENTINEL_HUB_AUTH_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": settings.SENTINEL_HUB_CLIENT_ID,
            "client_secret": settings.SENTINEL_HUB_CLIENT_SECRET,
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get("access_token")


def get_available_dates(
    latitude: float,
    longitude: float,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    max_cloud_coverage: float = 20.0,
) -> List[Dict[str, Any]]:
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    token = _get_auth_token()
    if not token:
        return []
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "collections": ["sentinel-2-l2a"],
        "bbox": [longitude - 0.01, latitude - 0.01, longitude + 0.01, latitude + 0.01],
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "filter": f"eo:cloud_cover < {max_cloud_coverage}",
        "limit": 50,
    }
    try:
        response = requests.post(SENTINEL_HUB_CATALOG_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        features = data.get("features", [])
        return [
            {
                "date": f.get("properties", {}).get("datetime", ""),
                "cloud_coverage": f.get("properties", {}).get("eo:cloud_cover", 0),
                "id": f.get("id", ""),
            }
            for f in features
        ]
    except requests.RequestException:
        return []


def get_satellite_image(
    latitude: float,
    longitude: float,
    date: Optional[str] = None,
    width: int = 1024,
    height: int = 1024,
    bands: str = "true_color",
) -> Optional[bytes]:
    token = _get_auth_token()
    if not token:
        return None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    band_map = {
        "true_color": {"B04": 1.0, "B03": 1.0, "B02": 1.0},
        "false_color": {"B08": 1.0, "B04": 1.0, "B03": 1.0},
        "ndvi": {"B08": 1.0, "B04": 1.0},
        "swir": {"B12": 1.0, "B08": 1.0, "B04": 1.0},
    }
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: [{ bands: ["B04", "B03", "B02", "dataMask"], units: "REFLECTANCE" }],
            output: { bands: 4 }
        };
    }
    function evaluatePixel(sample) {
        return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, sample.dataMask];
    }
    """
    if date is None:
        date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    payload = {
        "input": {
            "bounds": {
                "bbox": [longitude - 0.005, latitude - 0.005, longitude + 0.005, latitude + 0.005]
            },
            "data": [
                {
                    "dataFilter": {"timeRange": {"from": f"{date}T00:00:00Z", "to": f"{date}T23:59:59Z"}},
                    "type": "sentinel-2-l2a",
                }
            ],
        },
        "output": {"width": width, "height": height, "responses": [{"format": {"type": "image/png"}}]},
        "evalscript": evalscript,
    }
    try:
        response = requests.post(SENTINEL_HUB_PROCESS_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        return response.content
    except requests.RequestException:
        return None


def compute_ndvi(
    latitude: float,
    longitude: float,
    date: Optional[str] = None,
    width: int = 512,
    height: int = 512,
) -> Optional[bytes]:
    token = _get_auth_token()
    if not token:
        return None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: [{ bands: ["B04", "B08", "dataMask"], units: "REFLECTANCE" }],
            output: { bands: 4, mosaicking: "leastCC" }
        };
    }
    function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        let val = (ndvi + 1) / 2;
        return [val, val, val, sample.dataMask];
    }
    """
    if date is None:
        date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    payload = {
        "input": {
            "bounds": {
                "bbox": [longitude - 0.01, latitude - 0.01, longitude + 0.01, latitude + 0.01]
            },
            "data": [
                {
                    "dataFilter": {"timeRange": {"from": f"{date}T00:00:00Z", "to": f"{date}T23:59:59Z"}},
                    "type": "sentinel-2-l2a",
                }
            ],
        },
        "output": {"width": width, "height": height},
        "evalscript": evalscript,
    }
    try:
        response = requests.post(SENTINEL_HUB_PROCESS_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        return response.content
    except requests.RequestException:
        return None
