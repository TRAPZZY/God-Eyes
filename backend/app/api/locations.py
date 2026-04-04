"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Location Management API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

CRUD operations for monitored locations, geofencing, annotations,
and address geocoding integration.

NOTE: Static routes (geocode, search) MUST be defined before dynamic
routes (/{location_id}) to prevent FastAPI from matching them as UUIDs.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.database import get_db
from app.models.user import User
from app.models.location import Location, Geofence, Annotation
from app.schemas.location import (
    LocationCreate, LocationUpdate, LocationResponse,
    GeofenceCreate, GeofenceResponse,
    AnnotationCreate, AnnotationResponse,
)
from app.schemas.capture import CaptureResponse
from app.models.capture import Capture
from app.core.security import get_current_user
from app.services.geocoding import geocode_raw_address, reverse_geocode, autocomplete_suggestions

router = APIRouter()


# ============================================================
# STATIC ROUTES (must be before /{location_id})
# ============================================================

@router.get("/search/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=2),
    limit: int = Query(5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
):
    return autocomplete_suggestions(q, limit)


@router.get("/geocode")
async def geocode_location(
    address: str = Query(..., min_length=3),
    current_user: User = Depends(get_current_user),
):
    result = geocode_raw_address(address)
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return result


# ============================================================
# COLLECTION ROUTES
# ============================================================

@router.get("/", response_model=List[LocationResponse])
async def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    monitored_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Location).filter(Location.user_id == current_user.id)
    if monitored_only:
        query = query.filter(Location.is_monitored == True)
    locations = query.order_by(Location.created_at.desc()).offset(skip).limit(limit).all()
    return locations


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = Location(
        user_id=current_user.id,
        name=location_data.name,
        address=location_data.address,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        zoom_level=location_data.zoom_level or 15.0,
        tags=location_data.tags,
        notes=location_data.notes,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


# ============================================================
# DYNAMIC ROUTES (/{location_id} and sub-routes)
# ============================================================

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: uuid.UUID,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    update_data = location_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(location, key, value)
    db.commit()
    db.refresh(location)
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(location)
    db.commit()
    return None


@router.get("/{location_id}/captures", response_model=List[CaptureResponse])
async def get_location_captures(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    captures = db.query(Capture).filter(Capture.location_id == location_id).order_by(Capture.captured_at.desc()).all()
    return captures


@router.get("/{location_id}/reverse-geocode")
async def reverse_geocode_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    address = reverse_geocode(float(location.latitude), float(location.longitude))
    return {"address": address, "latitude": float(location.latitude), "longitude": float(location.longitude)}


@router.post("/{location_id}/geofences", response_model=GeofenceResponse, status_code=status.HTTP_201_CREATED)
async def create_geofence(
    location_id: uuid.UUID,
    geofence_data: GeofenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    geofence = Geofence(
        location_id=location_id,
        name=geofence_data.name,
        coordinates=geofence_data.coordinates,
        alert_on_change=geofence_data.alert_on_change,
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    return geofence


@router.post("/{location_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    location_id: uuid.UUID,
    annotation_data: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(Location.id == location_id, Location.user_id == current_user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    annotation = Annotation(
        location_id=location_id,
        user_id=current_user.id,
        coordinates=annotation_data.coordinates,
        note=annotation_data.note,
        annotation_type=annotation_data.annotation_type,
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation
