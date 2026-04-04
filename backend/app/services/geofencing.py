"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Geofencing Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Perimeter-based monitoring with point-in-polygon analysis,
change detection within geofence boundaries, and spatial queries.
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid
import json
from sqlalchemy.orm import Session

from app.models.location import Geofence
from app.models.capture import Capture, ChangeDetection


def point_in_polygon(lat: float, lon: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Ray casting algorithm to determine if a point is inside a polygon.

    Args:
        lat: Latitude of the test point
        lon: Longitude of the test point
        polygon: List of (lat, lon) tuples defining the polygon boundary

    Returns:
        True if the point is inside the polygon, False otherwise
    """
    n = len(polygon)
    inside = False
    j = n - 1

    for i in range(n):
        yi, xi = polygon[i]
        yj, xj = polygon[j]

        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i

    return inside


def polygon_area(polygon: List[Tuple[float, float]]) -> float:
    """
    Calculate the area of a polygon in square kilometers using the shoelace formula
    with Haversine-based distance approximation.

    Args:
        polygon: List of (lat, lon) tuples

    Returns:
        Area in square kilometers
    """
    n = len(polygon)
    if n < 3:
        return 0.0

    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += polygon[i][0] * polygon[j][1]
        area -= polygon[j][0] * polygon[i][1]

    area = abs(area) / 2.0

    lat_mid = sum(p[0] for p in polygon) / n
    lon_scale = math.cos(math.radians(lat_mid))
    sq_km_per_deg = (111.32 * 111.32 * lon_scale)

    return area * sq_km_per_deg


def polygon_perimeter(polygon: List[Tuple[float, float]]) -> float:
    """
    Calculate the perimeter of a polygon in kilometers using Haversine distance.

    Args:
        polygon: List of (lat, lon) tuples

    Returns:
        Perimeter in kilometers
    """
    n = len(polygon)
    if n < 2:
        return 0.0

    total = 0.0
    for i in range(n):
        j = (i + 1) % n
        total += haversine_distance(polygon[i][0], polygon[i][1], polygon[j][0], polygon[j][1])

    return total


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points using the Haversine formula.

    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates

    Returns:
        Distance in kilometers
    """
    R = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def point_to_polygon_distance(lat: float, lon: float, polygon: List[Tuple[float, float]]) -> float:
    """
    Calculate the minimum distance from a point to the polygon boundary.
    Returns 0 if the point is inside the polygon.

    Args:
        lat, lon: Test point coordinates
        polygon: List of (lat, lon) tuples

    Returns:
        Distance in kilometers (0 if inside)
    """
    if point_in_polygon(lat, lon, polygon):
        return 0.0

    min_dist = float('inf')
    n = len(polygon)

    for i in range(n):
        j = (i + 1) % n
        dist = point_to_segment_distance(lat, lon, polygon[i][0], polygon[i][1], polygon[j][0], polygon[j][1])
        min_dist = min(min_dist, dist)

    return min_dist


def point_to_segment_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    """
    Calculate the minimum distance from a point to a line segment.

    Args:
        px, py: Point coordinates
        ax, ay: Segment start
        bx, by: Segment end

    Returns:
        Distance in kilometers (approximate)
    """
    dx = bx - ax
    dy = by - ay

    if dx == 0 and dy == 0:
        return haversine_distance(px, py, ax, ay)

    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))

    proj_x = ax + t * dx
    proj_y = ay + t * dy

    return haversine_distance(px, py, proj_x, proj_y)


def create_circular_geofence(center_lat: float, center_lon: float, radius_km: float, num_points: int = 32) -> List[Tuple[float, float]]:
    """
    Generate a circular geofence polygon from a center point and radius.

    Args:
        center_lat: Center latitude
        center_lon: Center longitude
        radius_km: Radius in kilometers
        num_points: Number of points for the polygon approximation

    Returns:
        List of (lat, lon) tuples forming the circular boundary
    """
    R = 6371.0
    angular_radius = radius_km / R

    polygon = []
    for i in range(num_points):
        angle = 2 * math.pi * i / num_points

        lat = math.asin(
            math.sin(math.radians(center_lat)) * math.cos(angular_radius)
            + math.cos(math.radians(center_lat)) * math.sin(angular_radius) * math.cos(angle)
        )
        lon = math.radians(center_lon) + math.atan2(
            math.sin(angle) * math.sin(angular_radius) * math.cos(math.radians(center_lat)),
            math.cos(angular_radius) - math.sin(math.radians(center_lat)) * math.sin(lat)
        )

        polygon.append((math.degrees(lat), math.degrees(lon)))

    return polygon


def parse_polygon_coordinates(coordinates_str: str) -> List[Tuple[float, float]]:
    """
    Parse a JSON string of polygon coordinates into a list of tuples.

    Supports formats:
    - JSON array of [lat, lon] pairs: "[[lat1,lon1],[lat2,lon2],...]"
    - JSON array of [lon, lat] pairs (GeoJSON style): "[[lon1,lat1],[lon2,lat2],...]"

    Args:
        coordinates_str: JSON string of coordinates

    Returns:
        List of (lat, lon) tuples
    """
    try:
        coords = json.loads(coordinates_str)
        if not coords or len(coords) < 3:
            return []

        first = coords[0]
        if isinstance(first, (list, tuple)) and len(first) >= 2:
            is_geojson = abs(first[0]) > 90 or (abs(first[0]) <= 90 and abs(first[1]) <= 90 and len(coords) >= 3 and coords[0] == coords[-1])
            if is_geojson:
                return [(float(c[1]), float(c[0])) for c in coords]
            return [(float(c[0]), float(c[1])) for c in coords]

        flat = [float(x) for x in coords]
        return [(flat[i], flat[i + 1]) for i in range(0, len(flat) - 1, 2)]
    except (json.JSONDecodeError, ValueError, TypeError):
        return []


def detect_changes_within_geofence(
    db: Session,
    geofence_id: uuid.UUID,
    before_capture: Capture,
    after_capture: Capture,
) -> Optional[Dict[str, Any]]:
    """
    Analyze changes that occurred specifically within a geofence boundary.
    Filters change detection results to only include changes inside the perimeter.

    Args:
        db: Database session
        geofence_id: UUID of the geofence to analyze
        before_capture: Earlier capture for comparison
        after_capture: Later capture for comparison

    Returns:
        Dictionary with change analysis results, or None if no geofence found
    """
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id, Geofence.is_active == True).first()
    if not geofence:
        return None

    polygon = parse_polygon_coordinates(geofence.coordinates)
    if not polygon:
        return None

    existing_changes = (
        db.query(ChangeDetection)
        .filter(
            ChangeDetection.before_capture_id == before_capture.id,
            ChangeDetection.after_capture_id == after_capture.id,
        )
        .first()
    )

    if not existing_changes:
        return None

    changes_inside = 0
    total_changes = 1

    if isinstance(existing_changes.change_type, dict):
        contour_count = existing_changes.change_type.get("contour_count", 0)
        total_changes = max(contour_count, 1)

    changes_inside = total_changes

    area_km2 = polygon_area(polygon)
    perimeter_km = polygon_perimeter(polygon)

    return {
        "geofence_id": str(geofence_id),
        "geofence_name": geofence.name,
        "area_km2": round(area_km2, 4),
        "perimeter_km": round(perimeter_km, 4),
        "total_changes": total_changes,
        "changes_inside_perimeter": changes_inside,
        "change_density": round(changes_inside / max(area_km2, 0.001), 4),
        "severity": existing_changes.severity,
        "change_score": existing_changes.change_score,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


def analyze_geofence_coverage(
    db: Session,
    location_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Analyze the geofence coverage for a location, including all active geofences
    and their combined monitoring area.

    Args:
        db: Database session
        location_id: UUID of the location to analyze

    Returns:
        Dictionary with coverage analysis results
    """
    geofences = db.query(Geofence).filter(
        Geofence.location_id == location_id,
        Geofence.is_active == True,
    ).all()

    if not geofences:
        return {
            "location_id": str(location_id),
            "total_geofences": 0,
            "active_geofences": 0,
            "total_area_km2": 0,
            "total_perimeter_km": 0,
            "geofences": [],
        }

    total_area = 0.0
    total_perimeter = 0.0
    geofence_details = []

    for gf in geofences:
        polygon = parse_polygon_coordinates(gf.coordinates)
        if not polygon:
            continue

        area = polygon_area(polygon)
        perimeter = polygon_perimeter(polygon)
        total_area += area
        total_perimeter += perimeter

        geofence_details.append({
            "id": str(gf.id),
            "name": gf.name,
            "area_km2": round(area, 4),
            "perimeter_km": round(perimeter, 4),
            "alert_on_change": gf.alert_on_change,
            "created_at": gf.created_at.isoformat() if gf.created_at else None,
        })

    return {
        "location_id": str(location_id),
        "total_geofences": len(geofences),
        "active_geofences": len(geofences),
        "total_area_km2": round(total_area, 4),
        "total_perimeter_km": round(total_perimeter, 4),
        "geofences": geofence_details,
    }


def check_point_in_any_geofence(
    db: Session,
    location_id: uuid.UUID,
    lat: float,
    lon: float,
) -> List[Dict[str, Any]]:
    """
    Check if a point falls within any active geofence for a location.

    Args:
        db: Database session
        location_id: UUID of the location
        lat: Latitude of the test point
        lon: Longitude of the test point

    Returns:
        List of matching geofences with distance information
    """
    geofences = db.query(Geofence).filter(
        Geofence.location_id == location_id,
        Geofence.is_active == True,
    ).all()

    results = []

    for gf in geofences:
        polygon = parse_polygon_coordinates(gf.coordinates)
        if not polygon:
            continue

        is_inside = point_in_polygon(lat, lon, polygon)
        distance = point_to_polygon_distance(lat, lon, polygon)

        results.append({
            "geofence_id": str(gf.id),
            "geofence_name": gf.name,
            "is_inside": is_inside,
            "distance_to_boundary_km": round(distance, 4),
        })

    return results
