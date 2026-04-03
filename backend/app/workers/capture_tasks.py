"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Capture Worker Tasks

Creator: Trapzzy
Contact: traphubs@outlook.com

Celery tasks for scheduled satellite captures across all monitored locations.
Handles automatic image acquisition from Mapbox and Sentinel Hub on configured intervals.
"""

from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.schedule import MonitoringSchedule
from app.models.location import Location
from app.models.capture import Capture
from app.services.capture_engine import capture_location
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.capture_tasks.scheduled_capture_task", bind=True)
def scheduled_capture_task(self):
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        schedules = (
            db.query(MonitoringSchedule)
            .join(Location)
            .filter(
                MonitoringSchedule.is_active == True,
                MonitoringSchedule.next_capture_at <= now,
            )
            .all()
        )
        results = {"success": 0, "failed": 0, "total": len(schedules)}
        for schedule in schedules:
            location = schedule.location
            if not location:
                results["failed"] += 1
                continue
            capture = capture_location(
                db=db,
                location_id=location.id,
                latitude=float(location.latitude),
                longitude=float(location.longitude),
                zoom=float(location.zoom_level) if location.zoom_level else 15.0,
                resolution=schedule.capture_resolution,
                style=schedule.capture_style,
            )
            if capture:
                schedule.last_capture_at = datetime.now(timezone.utc)
                schedule.total_captures = (schedule.total_captures or 0) + 1
                frequency_map = {"hourly": 1/24, "daily": 1, "weekly": 7, "monthly": 30}
                hours = frequency_map.get(schedule.frequency.value, 24)
                schedule.next_capture_at = now + timedelta(hours=hours)
                db.commit()
                results["success"] += 1
                logger.info(f"Capture successful for location {location.name} ({location.id})")
            else:
                results["failed"] += 1
                logger.error(f"Capture failed for location {location.name} ({location.id})")
        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Scheduled capture task failed: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.capture_tasks.batch_capture_task", bind=True)
def batch_capture_task(self, location_ids: list, resolution: str = "standard", style: str = "satellite"):
    db = SessionLocal()
    try:
        results = {"success": [], "failed": []}
        for loc_id_str in location_ids:
            loc_id = uuid.UUID(loc_id_str)
            location = db.query(Location).filter(Location.id == loc_id).first()
            if not location:
                results["failed"].append({"id": loc_id_str, "reason": "Location not found"})
                continue
            capture = capture_location(
                db=db,
                location_id=location.id,
                latitude=float(location.latitude),
                longitude=float(location.longitude),
                zoom=float(location.zoom_level) if location.zoom_level else 15.0,
                resolution=resolution,
                style=style,
            )
            if capture:
                results["success"].append(str(capture.id))
            else:
                results["failed"].append({"id": loc_id_str, "reason": "Capture failed"})
        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Batch capture task failed: {str(e)}")
        raise
    finally:
        db.close()
