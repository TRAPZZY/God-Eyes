"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Standalone Scheduler (No Celery Required)

Creator: Trapzzy
Contact: traphubs@outlook.com

Thread-based scheduler for automated satellite captures.
Works without Docker/Celery for preview and lightweight deployments.
In production, this is replaced by Celery Beat + Celery Workers.
"""

import threading
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.database import SessionLocal
from app.models.schedule import MonitoringSchedule
from app.models.location import Location
from app.services.capture_engine import capture_location
from app.services.change_detection import HAS_CV2, HAS_SKIMAGE

logger = logging.getLogger(__name__)


class CaptureScheduler:
    """
    Background scheduler that checks monitoring schedules every 60 seconds
    and triggers captures when the next_capture_at time has passed.
    """

    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._interval = 60
        self._stats = {
            "total_runs": 0,
            "total_captures": 0,
            "total_errors": 0,
            "last_run": None,
        }

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info("CaptureScheduler started")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("CaptureScheduler stopped")

    def _run_loop(self):
        while self._running:
            try:
                self._check_schedules()
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                self._stats["total_errors"] += 1
            time.sleep(self._interval)

    def _check_schedules(self):
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
            self._stats["total_runs"] += 1
            self._stats["last_run"] = now.isoformat()

            for schedule in schedules:
                location = schedule.location
                if not location:
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
                    self._stats["total_captures"] += 1
                    logger.info(f"Captured: {location.name} ({location.id})")
                else:
                    self._stats["total_errors"] += 1
                    logger.error(f"Capture failed: {location.name}")
        except Exception as e:
            db.rollback()
            logger.error(f"Schedule check error: {e}")
            self._stats["total_errors"] += 1
        finally:
            db.close()

    def get_stats(self):
        return self._stats.copy()


scheduler = CaptureScheduler()
