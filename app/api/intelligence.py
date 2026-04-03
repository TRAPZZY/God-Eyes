"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Intelligence API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

Consolidated API endpoints for weather, camera feeds, batch processing,
import/export, and AI analysis services.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import json

from app.database import get_db
from app.models.user import User
from app.models.location import Location
from app.core.security import get_current_user
from app.services.weather import (
    get_current_weather,
    get_forecast,
    get_weather_cameras,
    get_weather_by_city,
    get_uv_index,
    get_air_pollution,
)
from app.services.camera import (
    get_webcams_nearby,
    get_camera_image,
    get_camera_history,
)
from app.services.batch import (
    process_csv_import,
    generate_csv_template,
    validate_csv_format,
)
from app.services.import_export import (
    export_geojson,
    import_geojson,
    export_kml,
    import_kml,
    export_gpx,
    import_gpx,
    detect_format,
)
from app.services.ai_analysis import (
    classify_land_use,
    detect_objects,
    analyze_image_quality,
    compute_vegetation_index,
)
from app.services.timelapse import generate_timelapse
from app.services.reports import generate_report
from app.services.heatmap import generate_heatmap
from app.models.capture import Capture

router = APIRouter()


# ============================================================
# Weather Endpoints
# ============================================================

@router.get("/weather/current/{location_id}")
async def get_location_weather(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current weather conditions for a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    weather = get_current_weather(float(location.latitude), float(location.longitude))
    if not weather:
        raise HTTPException(
            status_code=503,
            detail="Weather data unavailable. Configure OpenWeatherMap API key.",
        )

    return {"location_id": str(location_id), "location_name": location.name, **weather}


@router.get("/weather/forecast/{location_id}")
async def get_location_forecast(
    location_id: uuid.UUID,
    days: int = Query(5, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get multi-day weather forecast for a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    forecast = get_forecast(float(location.latitude), float(location.longitude), days)
    if not forecast:
        raise HTTPException(
            status_code=503,
            detail="Forecast data unavailable. Configure OpenWeatherMap API key.",
        )

    return {"location_id": str(location_id), "location_name": location.name, **forecast}


@router.get("/weather/uv/{location_id}")
async def get_location_uv(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get UV index for a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    uv = get_uv_index(float(location.latitude), float(location.longitude))
    return {"location_id": str(location_id), **uv} if uv else {"location_id": str(location_id), "uv_index": None}


@router.get("/weather/air-quality/{location_id}")
async def get_location_air_quality(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get air pollution data for a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    air = get_air_pollution(float(location.latitude), float(location.longitude))
    return {"location_id": str(location_id), **air} if air else {"location_id": str(location_id), "aqi": None}


@router.get("/weather/cameras/{location_id}")
async def get_location_weather_cameras(
    location_id: uuid.UUID,
    radius_km: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Discover weather cameras near a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    cameras = get_weather_cameras(
        float(location.latitude),
        float(location.longitude),
        radius_km,
    )
    return {"location_id": str(location_id), "cameras": cameras, "count": len(cameras)}


# ============================================================
# Camera Endpoints
# ============================================================

@router.get("/cameras/{location_id}")
async def get_location_cameras(
    location_id: uuid.UUID,
    radius_km: int = Query(50, ge=1, le=200),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get live webcam feeds near a monitored location."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    cameras = get_webcams_nearby(
        float(location.latitude),
        float(location.longitude),
        radius_km,
        limit,
    )
    return {
        "location_id": str(location_id),
        "location_name": location.name,
        "cameras": cameras,
        "count": len(cameras),
    }


@router.get("/cameras/{camera_id}/image")
async def get_camera_feed_image(
    camera_id: str,
    source: str = Query("openweathermap"),
):
    """Fetch the latest image from a webcam."""
    image_data = get_camera_image(camera_id, source)
    if not image_data:
        raise HTTPException(status_code=404, detail="Camera image unavailable")

    return Response(content=image_data, media_type="image/jpeg")


@router.get("/cameras/{camera_id}/history")
async def get_camera_timelapse(
    camera_id: str,
    source: str = Query("windy"),
):
    """Get historical timelapse data for a camera."""
    history = get_camera_history(camera_id, source)
    return {"camera_id": camera_id, "history": history}


# ============================================================
# Batch Processing Endpoints
# ============================================================

@router.post("/batch/import")
async def import_locations_batch(
    file: UploadFile = File(...),
    skip_geocoding: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bulk import locations from a CSV file.
    Expected columns: name, latitude, longitude, address, zoom_level, tags, notes
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = (await file.read()).decode("utf-8")

    result = process_csv_import(db, current_user.id, content, skip_geocoding)
    return result


@router.get("/batch/template")
async def download_csv_template():
    """Download a CSV template for bulk location import."""
    template = generate_csv_template()
    return Response(
        content=template,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=locations_template.csv"},
    )


@router.post("/batch/validate")
async def validate_csv(file: UploadFile = File(...)):
    """Validate a CSV file without importing."""
    content = (await file.read()).decode("utf-8")
    is_valid, errors = validate_csv_format(content)
    return {"valid": is_valid, "errors": errors}


# ============================================================
# Import/Export Endpoints
# ============================================================

@router.get("/export/geojson")
async def export_locations_geojson(
    location_ids: Optional[str] = Query(None, description="Comma-separated UUIDs"),
    include_geofences: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export locations as GeoJSON."""
    ids = None
    if location_ids:
        try:
            ids = [uuid.UUID(x.strip()) for x in location_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid location IDs")

    data = export_geojson(db, current_user.id, ids, include_geofences)
    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=godeyes_export.geojson"},
    )


@router.post("/import/geojson")
async def import_locations_geojson(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import locations from a GeoJSON file."""
    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid GeoJSON file")

    created, errors = import_geojson(db, current_user.id, data)
    return {
        "imported": len(created),
        "errors": errors,
        "locations": [{"id": str(loc.id), "name": loc.name} for loc in created],
    }


@router.get("/export/kml")
async def export_locations_kml(
    location_ids: Optional[str] = Query(None),
    include_geofences: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export locations as KML for Google Earth."""
    ids = None
    if location_ids:
        try:
            ids = [uuid.UUID(x.strip()) for x in location_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid location IDs")

    kml_content = export_kml(db, current_user.id, ids, include_geofences)
    return Response(
        content=kml_content,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": "attachment; filename=godeyes_export.kml"},
    )


@router.post("/import/kml")
async def import_locations_kml(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import locations from a KML file."""
    content = (await file.read()).decode("utf-8")
    created, errors = import_kml(db, current_user.id, content)
    return {
        "imported": len(created),
        "errors": errors,
        "locations": [{"id": str(loc.id), "name": loc.name} for loc in created],
    }


@router.get("/export/gpx")
async def export_locations_gpx(
    location_ids: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export locations as GPX waypoints."""
    ids = None
    if location_ids:
        try:
            ids = [uuid.UUID(x.strip()) for x in location_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid location IDs")

    gpx_content = export_gpx(db, current_user.id, ids)
    return Response(
        content=gpx_content,
        media_type="application/gpx+xml",
        headers={"Content-Disposition": "attachment; filename=godeyes_export.gpx"},
    )


@router.post("/import/gpx")
async def import_locations_gpx(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import locations from a GPX file."""
    content = (await file.read()).decode("utf-8")
    created, errors = import_gpx(db, current_user.id, content)
    return {
        "imported": len(created),
        "errors": errors,
        "locations": [{"id": str(loc.id), "name": loc.name} for loc in created],
    }


@router.post("/import/auto-detect")
async def auto_detect_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-detect file format and import locations."""
    content = (await file.read()).decode("utf-8")
    fmt = detect_format(content)

    if fmt == "geojson":
        data = json.loads(content)
        created, errors = import_geojson(db, current_user.id, data)
    elif fmt == "kml":
        created, errors = import_kml(db, current_user.id, content)
    elif fmt == "gpx":
        created, errors = import_gpx(db, current_user.id, content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Supported: GeoJSON, KML, GPX",
        )

    return {
        "detected_format": fmt,
        "imported": len(created),
        "errors": errors,
        "locations": [{"id": str(loc.id), "name": loc.name} for loc in created],
    }


# ============================================================
# AI Analysis Endpoints
# ============================================================

@router.post("/ai/land-use")
async def analyze_land_use(
    location_id: Optional[uuid.UUID] = Query(None),
    capture_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze land use classification from a satellite capture.
    Provide either location_id (uses latest capture) or capture_id.
    """
    image_path = None

    if capture_id:
        capture = (
            db.query(Capture)
            .join(Location)
            .filter(
                Capture.id == capture_id,
                Location.user_id == current_user.id,
            )
            .first()
        )
        if capture and capture.image_path:
            image_path = capture.image_path
    elif location_id:
        location = db.query(Location).filter(
            Location.id == location_id,
            Location.user_id == current_user.id,
        ).first()
        if location:
            latest_capture = (
                db.query(Capture)
                .filter(Capture.location_id == location_id)
                .order_by(Capture.captured_at.desc())
                .first()
            )
            if latest_capture and latest_capture.image_path:
                image_path = latest_capture.image_path

    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No capture image available for analysis",
        )

    result = classify_land_use(image_path=image_path)
    return result


@router.post("/ai/object-detection")
async def analyze_objects(
    location_id: Optional[uuid.UUID] = Query(None),
    capture_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Perform object detection on a satellite capture.
    """
    image_path = None

    if capture_id:
        capture = (
            db.query(Capture)
            .join(Location)
            .filter(
                Capture.id == capture_id,
                Location.user_id == current_user.id,
            )
            .first()
        )
        if capture and capture.image_path:
            image_path = capture.image_path
    elif location_id:
        latest_capture = (
            db.query(Capture)
            .filter(Capture.location_id == location_id)
            .order_by(Capture.captured_at.desc())
            .first()
        )
        if latest_capture and latest_capture.image_path:
            image_path = latest_capture.image_path

    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No capture image available for analysis",
        )

    result = detect_objects(image_path=image_path)
    return result


@router.post("/ai/image-quality")
async def analyze_quality(
    location_id: Optional[uuid.UUID] = Query(None),
    capture_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze satellite image quality metrics."""
    image_path = None

    if capture_id:
        capture = (
            db.query(Capture)
            .join(Location)
            .filter(
                Capture.id == capture_id,
                Location.user_id == current_user.id,
            )
            .first()
        )
        if capture and capture.image_path:
            image_path = capture.image_path
    elif location_id:
        latest_capture = (
            db.query(Capture)
            .filter(Capture.location_id == location_id)
            .order_by(Capture.captured_at.desc())
            .first()
        )
        if latest_capture and latest_capture.image_path:
            image_path = latest_capture.image_path

    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No capture image available for analysis",
        )

    result = analyze_image_quality(image_path=image_path)
    return result


@router.post("/ai/vegetation-index")
async def analyze_vegetation(
    location_id: Optional[uuid.UUID] = Query(None),
    capture_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute vegetation health index from RGB imagery."""
    image_path = None

    if capture_id:
        capture = (
            db.query(Capture)
            .join(Location)
            .filter(
                Capture.id == capture_id,
                Location.user_id == current_user.id,
            )
            .first()
        )
        if capture and capture.image_path:
            image_path = capture.image_path
    elif location_id:
        latest_capture = (
            db.query(Capture)
            .filter(Capture.location_id == location_id)
            .order_by(Capture.captured_at.desc())
            .first()
        )
        if latest_capture and latest_capture.image_path:
            image_path = latest_capture.image_path

    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No capture image available for analysis",
        )

    result = compute_vegetation_index(image_path=image_path)
    return result


# ============================================================
# Time-lapse Endpoints
# ============================================================

@router.post("/timelapse/generate")
async def generate_location_timelapse(
    location_id: uuid.UUID,
    style: str = Query("gif", description="Output format: gif or mp4"),
    fps: int = Query(5, ge=1, le=30, description="Frames per second"),
    duration_days: int = Query(30, ge=1, le=365, description="Days of captures to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an animated time-lapse from sequential satellite captures.
    Compiles frames into a GIF with timestamp overlays.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    result = generate_timelapse(
        db=db,
        location_id=location_id,
        style=style,
        fps=fps,
        duration_days=duration_days,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to generate time-lapse"))

    return result


@router.get("/timelapse/download/{filename}")
async def download_timelapse(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Download a generated time-lapse GIF file."""
    import os
    from app.config import get_settings
    settings = get_settings()
    file_path = os.path.join(settings.UPLOAD_DIR, "timelapses", filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Time-lapse file not found")

    return FileResponse(
        path=file_path,
        media_type="image/gif",
        filename=filename,
    )


# ============================================================
# Report Generation Endpoints
# ============================================================

@router.get("/report/{location_id}")
async def get_location_report(
    location_id: uuid.UUID,
    fmt: str = Query("html", description="Output format: html or pdf"),
    date_range: Optional[str] = Query(None, description="Date range as start:end ISO format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an intelligence report with capture history, change detections, and stats.
    Returns HTML by default; PDF if weasyprint is available.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    result = generate_report(
        db=db,
        location_id=location_id,
        fmt=fmt,
        date_range=date_range,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to generate report"))

    return result


# ============================================================
# Intelligence Summary Endpoint
# ============================================================

@router.get("/summary/{location_id}")
async def get_intelligence_summary(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a comprehensive intelligence summary for a location.
    Includes capture stats, change detection summary, AI analysis results,
    and monitoring status.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    total_captures = db.query(Capture).filter(Capture.location_id == location_id).count()

    from app.models.capture import ChangeDetection
    total_changes = db.query(ChangeDetection).filter(
        ChangeDetection.location_id == location_id
    ).count()
    high_severity = db.query(ChangeDetection).filter(
        ChangeDetection.location_id == location_id,
        ChangeDetection.severity == "high",
    ).count()

    from app.models.schedule import MonitoringSchedule
    schedules = db.query(MonitoringSchedule).filter(
        MonitoringSchedule.location_id == location_id
    ).all()

    from app.models.location import Geofence
    geofences = db.query(Geofence).filter(
        Geofence.location_id == location_id,
        Geofence.is_active == True,
    ).all()

    latest_capture = (
        db.query(Capture)
        .filter(Capture.location_id == location_id)
        .order_by(Capture.captured_at.desc())
        .first()
    )

    return {
        "location_id": str(location_id),
        "location_name": location.name,
        "coordinates": {
            "latitude": float(location.latitude),
            "longitude": float(location.longitude),
        },
        "capture_stats": {
            "total_captures": total_captures,
            "latest_capture": latest_capture.captured_at.isoformat() if latest_capture else None,
        },
        "change_detection": {
            "total_changes": total_changes,
            "high_severity": high_severity,
        },
        "monitoring": {
            "active_schedules": len([s for s in schedules if s.is_active]),
            "total_schedules": len(schedules),
        },
        "geofencing": {
            "active_geofences": len(geofences),
        },
    }


# ============================================================
# Heatmap Endpoints
# ============================================================

@router.get("/heatmap/{location_id}")
async def get_location_heatmap(
    location_id: uuid.UUID,
    width: int = Query(800, ge=200, le=2000),
    height: int = Query(600, ge=200, le=2000),
    radius: int = Query(40, ge=10, le=100),
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a heatmap image visualizing change intensity for a location.
    Change detections are rendered as colored blobs on a dark background.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    result = generate_heatmap(
        db=db,
        location_id=location_id,
        width=width,
        height=height,
        radius=radius,
        days=days,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to generate heatmap"))

    return result
