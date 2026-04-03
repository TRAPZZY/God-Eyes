"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Capture Engine Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Orchestrates satellite image capture operations across multiple providers.
Handles image saving, metadata extraction, resolution scaling, and source routing.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services.mapbox import fetch_static_map
from app.services.sentinel import get_satellite_image
from app.models.capture import Capture
from app.config import get_settings

settings = get_settings()


def capture_mapbox(
    db: Session,
    location_id: uuid.UUID,
    latitude: float,
    longitude: float,
    zoom: float = 15.0,
    resolution: str = "standard",
    style: str = "satellite",
) -> Optional[Capture]:
    try:
        image_data = fetch_static_map(longitude, latitude, zoom, style, resolution)
        resolution_map = {"standard": (800, 600), "high": (1920, 1080), "ultra": (2560, 1440), "8k": (7680, 4320)}
        width, height = resolution_map.get(resolution, resolution_map["standard"])
        filename = f"{uuid.uuid4()}.png"
        upload_dir = os.path.join(settings.UPLOAD_DIR, "captures", str(location_id))
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_data)
        capture = Capture(
            location_id=location_id,
            image_path=filepath,
            image_url=f"/uploads/captures/{location_id}/{filename}",
            resolution=resolution,
            source="mapbox",
            width=width,
            height=height,
            zoom_level=zoom,
            captured_at=datetime.now(timezone.utc),
            image_metadata={"style": style, "latitude": latitude, "longitude": longitude},
        )
        db.add(capture)
        db.commit()
        db.refresh(capture)
        return capture
    except Exception:
        db.rollback()
        return None


def capture_sentinel(
    db: Session,
    location_id: uuid.UUID,
    latitude: float,
    longitude: float,
    date: Optional[str] = None,
    resolution: str = "high",
) -> Optional[Capture]:
    try:
        image_data = get_satellite_image(latitude, longitude, date)
        if image_data is None:
            return None
        filename = f"{uuid.uuid4()}_sentinel.png"
        upload_dir = os.path.join(settings.UPLOAD_DIR, "captures", str(location_id))
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_data)
        capture = Capture(
            location_id=location_id,
            image_path=filepath,
            image_url=f"/uploads/captures/{location_id}/{filename}",
            resolution=resolution,
            source="sentinel_hub",
            width=1024,
            height=1024,
            captured_at=datetime.now(timezone.utc),
            image_metadata={"latitude": latitude, "longitude": longitude, "date_requested": date},
        )
        db.add(capture)
        db.commit()
        db.refresh(capture)
        return capture
    except Exception:
        db.rollback()
        return None


def capture_location(
    db: Session,
    location_id: uuid.UUID,
    latitude: float,
    longitude: float,
    zoom: float = 15.0,
    resolution: str = "standard",
    style: str = "satellite",
    source: str = "mapbox",
    date: Optional[str] = None,
) -> Optional[Capture]:
    if source == "sentinel_hub":
        return capture_sentinel(db, location_id, latitude, longitude, date, resolution)
    return capture_mapbox(db, location_id, latitude, longitude, zoom, resolution, style)
