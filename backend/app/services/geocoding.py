"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Geocoding Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Handles address-to-coordinate conversion using Nominatim (OpenStreetMap)
with reverse geocoding, autocomplete suggestions, and batch geocoding support.
"""

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import Optional, List
import time

_geolocator = Nominatim(user_agent="god_eyes_defense_platform")


def geocode_address(street: str, city: str, state: str, zip_code: str) -> Optional[dict]:
    address = f"{street}, {city}, {state} {zip_code}"
    try:
        location = _geolocator.geocode(address, timeout=10)
        if location:
            return {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "address": location.address,
            }
    except (GeocoderTimedOut, GeocoderServiceError):
        return None
    return None


def geocode_raw_address(address: str) -> Optional[dict]:
    try:
        location = _geolocator.geocode(address, timeout=10)
        if location:
            return {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "address": location.address,
            }
    except (GeocoderTimedOut, GeocoderServiceError):
        return None
    return None


def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
    try:
        location = _geolocator.reverse((latitude, longitude), timeout=10)
        return location.address if location else None
    except (GeocoderTimedOut, GeocoderServiceError):
        return None


def autocomplete_suggestions(query: str, limit: int = 5) -> List[dict]:
    try:
        results = _geolocator.geocode(query, exactly_one=False, limit=limit, timeout=10)
        if results:
            return [
                {
                    "display_name": r.address,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                }
                for r in results
            ]
    except (GeocoderTimedOut, GeocoderServiceError):
        pass
    return []


def batch_geocode(addresses: List[str]) -> List[dict]:
    results = []
    for address in addresses:
        result = geocode_raw_address(address)
        if result:
            result["query"] = address
            results.append(result)
        time.sleep(1)
    return results
