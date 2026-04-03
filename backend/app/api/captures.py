"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Capture API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

Endpoints for satellite image capture, retrieval, download,
and capture history management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from app.database import get_db
from app.models.user import User
from app.models.location import Location
from app.models.capture import Capture, ChangeDetection
from app.schemas.capture import CaptureResponse, CaptureListResponse, CaptureRequest, ChangeDetectionResponse
from app.core.security import get_current_user
from app.services.capture_engine import capture_location
from app.services.mapbox import get_static_map_url

router = APIRouter()


@router.post("/", response_model=CaptureResponse)
async def create_capture(
    capture_request: CaptureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == capture_request.location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    capture = capture_location(
        db=db,
        location_id=location.id,
        latitude=float(location.latitude),
        longitude=float(location.longitude),
        zoom=float(location.zoom_level) if location.zoom_level else 15.0,
        resolution=capture_request.resolution,
        style=capture_request.style,
    )
    if not capture:
        raise HTTPException(status_code=500, detail="Failed to capture satellite image")
    return capture


@router.get("/static-map-url")
async def get_static_map_url_endpoint(
    longitude: float = Query(..., ge=-180, le=180),
    latitude: float = Query(..., ge=-90, le=90),
    zoom: float = Query(15.0, ge=1, le=22),
    style: str = Query("satellite"),
    resolution: str = Query("standard"),
    current_user: User = Depends(get_current_user),
):
    url = get_static_map_url(longitude, latitude, zoom, style, resolution)
    return {"url": url}


@router.get("/{capture_id}", response_model=CaptureResponse)
async def get_capture(
    capture_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capture = db.query(Capture).join(Location).filter(
        Capture.id == capture_id,
        Location.user_id == current_user.id,
    ).first()
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    return capture


@router.get("/{capture_id}/download")
async def download_capture(
    capture_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capture = db.query(Capture).join(Location).filter(
        Capture.id == capture_id,
        Location.user_id == current_user.id,
    ).first()
    if not capture or not capture.image_path:
        raise HTTPException(status_code=404, detail="Capture image not found")
    if not os.path.exists(capture.image_path):
        raise HTTPException(status_code=404, detail="Image file not found on server")
    return FileResponse(
        path=capture.image_path,
        media_type="image/png",
        filename=f"godeyes_capture_{capture_id}.png",
    )


@router.get("/location/{location_id}/history", response_model=CaptureListResponse)
async def get_capture_history(
    location_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    total = db.query(Capture).filter(Capture.location_id == location_id).count()
    captures = (
        db.query(Capture)
        .filter(Capture.location_id == location_id)
        .order_by(Capture.captured_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {"captures": captures, "total": total, "page": page, "per_page": per_page}


@router.get("/location/{location_id}/changes", response_model=List[ChangeDetectionResponse])
async def get_location_changes(
    location_id: uuid.UUID,
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    query = db.query(ChangeDetection).filter(ChangeDetection.location_id == location_id)
    if severity:
        query = query.filter(ChangeDetection.severity == severity)
    changes = query.order_by(ChangeDetection.detected_at.desc()).all()
    return changes


@router.delete("/{capture_id}", status_code=204)
async def delete_capture(
    capture_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capture = db.query(Capture).join(Location).filter(
        Capture.id == capture_id,
        Location.user_id == current_user.id,
    ).first()
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    if capture.image_path and os.path.exists(capture.image_path):
        os.remove(capture.image_path)
    db.delete(capture)
    db.commit()
    return None
