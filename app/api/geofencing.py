"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Geofencing API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

API endpoints for geofence management, spatial analysis,
point-in-polygon queries, and perimeter-based change detection.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.user import User
from app.models.location import Location, Geofence
from app.schemas.location import GeofenceCreate, GeofenceResponse
from app.core.security import get_current_user
from app.services.geofencing import (
    point_in_polygon,
    polygon_area,
    polygon_perimeter,
    haversine_distance,
    point_to_polygon_distance,
    create_circular_geofence,
    parse_polygon_coordinates,
    detect_changes_within_geofence,
    analyze_geofence_coverage,
    check_point_in_any_geofence,
)
from app.models.capture import Capture

router = APIRouter()


@router.get("/coverage/{location_id}")
async def get_geofence_coverage(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze geofence coverage for a location.
    Returns area, perimeter, and details of all active geofences.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    coverage = analyze_geofence_coverage(db, location_id)
    return coverage


@router.post("/circular-geofence")
async def create_circular_geofence_endpoint(
    location_id: uuid.UUID,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(..., gt=0, le=100),
    name: str = Query(..., min_length=1, max_length=255),
    num_points: int = Query(32, ge=8, le=128),
    alert_on_change: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a circular geofence from a center point and radius.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    polygon = create_circular_geofence(latitude, longitude, radius_km, num_points)
    import json
    coordinates_json = json.dumps(polygon)

    geofence = Geofence(
        location_id=location_id,
        name=name,
        coordinates=coordinates_json,
        alert_on_change=alert_on_change,
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)

    return {
        "id": str(geofence.id),
        "location_id": str(location_id),
        "name": geofence.name,
        "coordinates": geofence.coordinates,
        "alert_on_change": geofence.alert_on_change,
        "is_active": geofence.is_active,
        "created_at": geofence.created_at.isoformat() if geofence.created_at else None,
        "area_km2": round(polygon_area(polygon), 4),
        "perimeter_km": round(polygon_perimeter(polygon), 4),
    }


@router.get("/check-point")
async def check_point_in_geofences_get(
    location_id: uuid.UUID,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if a point falls within any active geofence for a location (GET).
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    results = check_point_in_any_geofence(db, location_id, latitude, longitude)
    return {
        "latitude": latitude,
        "longitude": longitude,
        "geofences": results,
        "inside_any": any(r["is_inside"] for r in results),
    }


@router.post("/check-point")
async def check_point_in_geofences_post(
    location_id: uuid.UUID,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if a point falls within any active geofence for a location (POST).
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    results = check_point_in_any_geofence(db, location_id, latitude, longitude)
    return {
        "latitude": latitude,
        "longitude": longitude,
        "geofences": results,
        "inside_any": any(r["is_inside"] for r in results),
    }


@router.get("/{geofence_id}/analysis")
async def analyze_geofence(
    geofence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed analysis of a specific geofence including area and perimeter.
    """
    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    polygon = parse_polygon_coordinates(geofence.coordinates)
    if not polygon:
        raise HTTPException(status_code=400, detail="Invalid geofence coordinates")

    area = polygon_area(polygon)
    perimeter = polygon_perimeter(polygon)

    return {
        "id": str(geofence.id),
        "name": geofence.name,
        "location_id": str(geofence.location_id),
        "area_km2": round(area, 4),
        "perimeter_km": round(perimeter, 4),
        "vertex_count": len(polygon),
        "is_active": geofence.is_active,
        "alert_on_change": geofence.alert_on_change,
        "created_at": geofence.created_at.isoformat() if geofence.created_at else None,
    }


@router.post("/{geofence_id}/detect-changes")
async def detect_geofence_changes(
    geofence_id: uuid.UUID,
    before_capture_id: uuid.UUID = Query(...),
    after_capture_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Detect changes that occurred specifically within a geofence boundary.
    """
    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    before = db.query(Capture).filter(Capture.id == before_capture_id).first()
    after = db.query(Capture).filter(Capture.id == after_capture_id).first()

    if not before or not after:
        raise HTTPException(status_code=404, detail="One or both captures not found")

    result = detect_changes_within_geofence(db, geofence_id, before, after)
    if not result:
        raise HTTPException(status_code=400, detail="No change data available for this geofence")

    return result


@router.get("/{geofence_id}/points-inside")
async def get_points_inside_geofence(
    geofence_id: uuid.UUID,
    points: str = Query(..., description="JSON array of [lat,lon] pairs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check which points from a list fall inside a geofence.
    """
    import json

    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    polygon = parse_polygon_coordinates(geofence.coordinates)
    if not polygon:
        raise HTTPException(status_code=400, detail="Invalid geofence coordinates")

    try:
        point_list = json.loads(points)
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid points JSON")

    results = []
    for i, pt in enumerate(point_list):
        if len(pt) >= 2:
            lat, lon = float(pt[0]), float(pt[1])
            inside = point_in_polygon(lat, lon, polygon)
            distance = point_to_polygon_distance(lat, lon, polygon)
            results.append({
                "index": i,
                "latitude": lat,
                "longitude": lon,
                "is_inside": inside,
                "distance_to_boundary_km": round(distance, 4),
            })

    return {
        "geofence_id": str(geofence_id),
        "geofence_name": geofence.name,
        "total_points": len(results),
        "points_inside": sum(1 for r in results if r["is_inside"]),
        "points_outside": sum(1 for r in results if not r["is_inside"]),
        "results": results,
    }


@router.get("/{geofence_id}", response_model=GeofenceResponse)
async def get_geofence(
    geofence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific geofence by ID."""
    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return geofence


@router.put("/{geofence_id}", response_model=GeofenceResponse)
async def update_geofence(
    geofence_id: uuid.UUID,
    name: Optional[str] = Query(None),
    alert_on_change: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update geofence properties."""
    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    if name is not None:
        geofence.name = name
    if alert_on_change is not None:
        geofence.alert_on_change = alert_on_change
    if is_active is not None:
        geofence.is_active = is_active

    db.commit()
    db.refresh(geofence)
    return geofence


@router.delete("/{geofence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_geofence(
    geofence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a geofence."""
    geofence = (
        db.query(Geofence)
        .join(Location)
        .filter(
            Geofence.id == geofence_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    db.delete(geofence)
    db.commit()
    return None


@router.get("/distance/{location_id}")
async def calculate_distance(
    location_id: uuid.UUID,
    lat1: float = Query(...),
    lon1: float = Query(...),
    lat2: float = Query(...),
    lon2: float = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate the Haversine distance between two points.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    distance = haversine_distance(lat1, lon1, lat2, lon2)

    return {
        "point_a": {"latitude": lat1, "longitude": lon1},
        "point_b": {"latitude": lat2, "longitude": lon2},
        "distance_km": round(distance, 4),
        "distance_miles": round(distance * 0.621371, 4),
        "distance_meters": round(distance * 1000, 2),
    }
