"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Analysis API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

Endpoints for AI-powered image analysis, change detection,
NDVI computation, Sentinel Hub data queries, and report generation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.location import Location
from app.models.capture import Capture, ChangeDetection
from app.schemas.capture import CaptureResponse, ChangeDetectionResponse, ChangeDetectionSummary
from app.core.security import get_current_user
from app.services.change_detection import analyze_changes
from app.services.sentinel import get_available_dates, get_satellite_image, compute_ndvi
from app.services.capture_engine import capture_sentinel
from app.workers.scheduler import scheduler

router = APIRouter()


@router.post("/compare", response_model=ChangeDetectionResponse)
async def compare_captures(
    before_capture_id: uuid.UUID,
    after_capture_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    before = db.query(Capture).join(Location).filter(
        Capture.id == before_capture_id,
        Location.user_id == current_user.id,
    ).first()
    after = db.query(Capture).join(Location).filter(
        Capture.id == after_capture_id,
        Location.user_id == current_user.id,
    ).first()
    if not before or not after:
        raise HTTPException(status_code=404, detail="One or both captures not found")
    if before.location_id != after.location_id:
        raise HTTPException(status_code=400, detail="Captures must be from the same location")
    change = analyze_changes(db, before.location_id, before, after)
    if not change:
        raise HTTPException(status_code=500, detail="Failed to analyze changes")
    return change


@router.get("/summary/{location_id}", response_model=ChangeDetectionSummary)
async def get_change_summary(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    all_changes = db.query(ChangeDetection).filter(
        ChangeDetection.location_id == location_id
    ).order_by(ChangeDetection.detected_at.desc()).all()
    high = sum(1 for c in all_changes if c.severity == "high")
    medium = sum(1 for c in all_changes if c.severity == "medium")
    low = sum(1 for c in all_changes if c.severity == "low")
    return {
        "total_changes": len(all_changes),
        "high_severity": high,
        "medium_severity": medium,
        "low_severity": low,
        "recent_changes": all_changes[:10],
    }


@router.get("/sentinel-dates/{location_id}")
async def get_sentinel_dates(
    location_id: uuid.UUID,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    max_cloud_coverage: float = Query(20.0, ge=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    dates = get_available_dates(
        latitude=float(location.latitude),
        longitude=float(location.longitude),
        start_date=start_date,
        end_date=end_date,
        max_cloud_coverage=max_cloud_coverage,
    )
    return {"location_id": str(location_id), "available_dates": dates, "count": len(dates)}


@router.post("/sentinel-capture/{location_id}", response_model=CaptureResponse)
async def trigger_sentinel_capture(
    location_id: uuid.UUID,
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    capture = capture_sentinel(
        db=db,
        location_id=location_id,
        latitude=float(location.latitude),
        longitude=float(location.longitude),
        date=date,
    )
    if not capture:
        raise HTTPException(status_code=500, detail="Failed to capture Sentinel-2 image. Check date availability.")
    return capture


@router.get("/ndvi/{location_id}")
async def get_ndvi_image(
    location_id: uuid.UUID,
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    ndvi_data = compute_ndvi(
        latitude=float(location.latitude),
        longitude=float(location.longitude),
        date=date,
    )
    if not ndvi_data:
        raise HTTPException(status_code=500, detail="Failed to compute NDVI. Check Sentinel Hub configuration.")
    upload_dir = os.path.join("uploads", "ndvi", str(location_id))
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"ndvi_{uuid.uuid4()}.png"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(ndvi_data)
    return FileResponse(path=filepath, media_type="image/png", filename=filename)


@router.get("/diff/{change_id}")
async def get_diff_image(
    change_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change = (
        db.query(ChangeDetection)
        .join(Location)
        .filter(
            ChangeDetection.id == change_id,
            Location.user_id == current_user.id,
        )
        .first()
    )
    if not change or not change.diff_image_path:
        raise HTTPException(status_code=404, detail="Diff image not found")
    if not os.path.exists(change.diff_image_path):
        raise HTTPException(status_code=404, detail="Diff image file not found on server")
    return FileResponse(path=change.diff_image_path, media_type="image/png", filename=f"diff_{change_id}.png")


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_locations = db.query(Location).filter(Location.user_id == current_user.id).count()
    monitored_locations = (
        db.query(Location)
        .filter(Location.user_id == current_user.id, Location.is_monitored == True)
        .count()
    )
    total_captures = (
        db.query(Capture)
        .join(Location)
        .filter(Location.user_id == current_user.id)
        .count()
    )
    total_changes = (
        db.query(ChangeDetection)
        .join(Location)
        .filter(Location.user_id == current_user.id)
        .count()
    )
    high_severity_changes = (
        db.query(ChangeDetection)
        .join(Location)
        .filter(Location.user_id == current_user.id, ChangeDetection.severity == "high")
        .count()
    )
    return {
        "total_locations": total_locations,
        "monitored_locations": monitored_locations,
        "total_captures": total_captures,
        "total_changes": total_changes,
        "high_severity_changes": high_severity_changes,
    }


@router.get("/monitoring/status")
async def get_monitoring_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.schedule import MonitoringSchedule
    schedules = (
        db.query(MonitoringSchedule)
        .join(Location)
        .filter(Location.user_id == current_user.id)
        .all()
    )
    schedule_list = []
    for s in schedules:
        schedule_list.append({
            "id": str(s.id),
            "location_id": str(s.location_id),
            "location_name": s.location.name if s.location else "Unknown",
            "frequency": s.frequency.value if s.frequency else "daily",
            "is_active": s.is_active,
            "next_capture_at": s.next_capture_at.isoformat() if s.next_capture_at else None,
            "last_capture_at": s.last_capture_at.isoformat() if s.last_capture_at else None,
            "total_captures": s.total_captures or 0,
        })
    scheduler_stats = scheduler.get_stats()
    return {
        "schedules": schedule_list,
        "scheduler": scheduler_stats,
        "change_detection_available": True,
    }
