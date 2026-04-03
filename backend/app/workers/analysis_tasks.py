"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Analysis Worker Tasks

Creator: Trapzzy
Contact: traphubs@outlook.com

Celery tasks for automated change detection analysis between consecutive captures.
Triggers alert notifications when significant changes are detected.
"""

from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.location import Location
from app.models.capture import Capture
from app.models.schedule import AlertRule, MonitoringSchedule
from app.services.change_detection import analyze_changes
from app.services.notifications import dispatch_alert
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.analysis_tasks.change_detection_task", bind=True)
def change_detection_task(self, location_id: str):
    db = SessionLocal()
    try:
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return {"error": "Location not found"}
        captures = (
            db.query(Capture)
            .filter(Capture.location_id == location_id)
            .order_by(Capture.captured_at.desc())
            .limit(2)
            .all()
        )
        if len(captures) < 2:
            return {"status": "skipped", "reason": "Need at least 2 captures for comparison"}
        before_capture = captures[1]
        after_capture = captures[0]
        change = analyze_changes(db, location_id, before_capture, after_capture)
        if not change:
            return {"status": "failed", "reason": "Analysis failed"}
        result = {
            "status": "completed",
            "change_score": change.change_score,
            "severity": change.severity,
        }
        if change.severity in ("medium", "high"):
            alert_rules = (
                db.query(AlertRule)
                .filter(
                    AlertRule.location_id == location_id,
                    AlertRule.is_active == True,
                )
                .all()
            )
            for rule in alert_rules:
                dispatched = dispatch_alert(
                    channel=rule.notification_channel.value,
                    target=rule.notification_target,
                    location_name=location.name,
                    severity=change.severity,
                    change_score=change.change_score,
                    description=change.description or "",
                    detected_at=change.detected_at.isoformat(),
                )
                if dispatched:
                    change.alert_sent = True
                    rule.triggered_count = (rule.triggered_count or 0) + 1
                    rule.last_triggered_at = datetime.now(timezone.utc)
            db.commit()
        return result
    except Exception as e:
        db.rollback()
        logger.error(f"Change detection task failed for {location_id}: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.analysis_tasks.scheduled_analysis_task", bind=True)
def scheduled_analysis_task(self):
    db = SessionLocal()
    try:
        monitored_locations = (
            db.query(Location)
            .filter(Location.is_monitored == True)
            .all()
        )
        results = {"analyzed": 0, "changes_detected": 0, "alerts_sent": 0}
        for location in monitored_locations:
            captures = (
                db.query(Capture)
                .filter(Capture.location_id == location.id)
                .order_by(Capture.captured_at.desc())
                .limit(2)
                .all()
            )
            if len(captures) < 2:
                continue
            change = analyze_changes(db, location.id, captures[1], captures[0])
            if change:
                results["analyzed"] += 1
                if change.severity in ("medium", "high"):
                    results["changes_detected"] += 1
                    alert_rules = (
                        db.query(AlertRule)
                        .filter(
                            AlertRule.location_id == location.id,
                            AlertRule.is_active == True,
                        )
                        .all()
                    )
                    for rule in alert_rules:
                        dispatched = dispatch_alert(
                            channel=rule.notification_channel.value,
                            target=rule.notification_target,
                            location_name=location.name,
                            severity=change.severity,
                            change_score=change.change_score,
                            description=change.description or "",
                            detected_at=change.detected_at.isoformat(),
                        )
                        if dispatched:
                            change.alert_sent = True
                            rule.triggered_count = (rule.triggered_count or 0) + 1
                            rule.last_triggered_at = datetime.now(timezone.utc)
                            results["alerts_sent"] += 1
            db.commit()
        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Scheduled analysis task failed: {str(e)}")
        raise
    finally:
        db.close()
