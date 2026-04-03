"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Monitoring API Routes

Creator: Trapzzy
Contact: traphubs@outlook.com

Endpoints for managing monitoring schedules, alert rules,
and triggering manual captures on demand.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.user import User
from app.models.location import Location
from app.models.schedule import MonitoringSchedule, AlertRule
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleResponse,
    AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse,
)
from app.schemas.capture import CaptureResponse
from app.core.security import get_current_user
from app.services.capture_engine import capture_location

router = APIRouter()


@router.get("/schedules", response_model=List[ScheduleResponse])
async def list_schedules(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(MonitoringSchedule)
        .join(Location)
        .filter(Location.user_id == current_user.id)
    )
    if active_only:
        query = query.filter(MonitoringSchedule.is_active == True)
    return query.order_by(MonitoringSchedule.created_at.desc()).all()


@router.post("/schedules", response_model=ScheduleResponse, status_code=201)
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == schedule_data.location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    frequency_map = {"hourly": 1/24, "daily": 1, "weekly": 7, "monthly": 30}
    hours = frequency_map.get(schedule_data.frequency.value, 24)
    next_capture = datetime.now(timezone.utc) + timedelta(hours=hours)
    schedule = MonitoringSchedule(
        location_id=schedule_data.location_id,
        frequency=schedule_data.frequency,
        capture_resolution=schedule_data.capture_resolution,
        capture_style=schedule_data.capture_style,
        next_capture_at=next_capture,
    )
    location.is_monitored = True
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: uuid.UUID,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = (
        db.query(MonitoringSchedule)
        .join(Location)
        .filter(MonitoringSchedule.id == schedule_id, Location.user_id == current_user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    update_data = schedule_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", status_code=204)
async def delete_schedule(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = (
        db.query(MonitoringSchedule)
        .join(Location)
        .filter(MonitoringSchedule.id == schedule_id, Location.user_id == current_user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return None


@router.post("/schedules/{schedule_id}/trigger", response_model=CaptureResponse)
async def trigger_schedule_capture(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = (
        db.query(MonitoringSchedule)
        .join(Location)
        .filter(MonitoringSchedule.id == schedule_id, Location.user_id == current_user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    location = schedule.location
    capture = capture_location(
        db=db,
        location_id=location.id,
        latitude=float(location.latitude),
        longitude=float(location.longitude),
        zoom=float(location.zoom_level) if location.zoom_level else 15.0,
        resolution=schedule.capture_resolution,
        style=schedule.capture_style,
    )
    if not capture:
        raise HTTPException(status_code=500, detail="Failed to capture image")
    schedule.last_capture_at = datetime.now(timezone.utc)
    schedule.total_captures = (schedule.total_captures or 0) + 1
    frequency_map = {"hourly": 1/24, "daily": 1, "weekly": 7, "monthly": 30}
    hours = frequency_map.get(schedule.frequency.value, 24)
    schedule.next_capture_at = datetime.now(timezone.utc) + timedelta(hours=hours)
    db.commit()
    return capture


@router.get("/alerts", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AlertRule).filter(AlertRule.user_id == current_user.id)
    if active_only:
        query = query.filter(AlertRule.is_active == True)
    return query.order_by(AlertRule.created_at.desc()).all()


@router.post("/alerts", response_model=AlertRuleResponse, status_code=201)
async def create_alert_rule(
    alert_data: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = db.query(Location).filter(
        Location.id == alert_data.location_id,
        Location.user_id == current_user.id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    alert_rule = AlertRule(
        user_id=current_user.id,
        location_id=alert_data.location_id,
        rule_type=alert_data.rule_type,
        name=alert_data.name,
        conditions=alert_data.conditions,
        threshold=alert_data.threshold,
        notification_channel=alert_data.notification_channel,
        notification_target=alert_data.notification_target,
    )
    db.add(alert_rule)
    db.commit()
    db.refresh(alert_rule)
    return alert_rule


@router.put("/alerts/{alert_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    alert_id: uuid.UUID,
    alert_data: AlertRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert_rule = db.query(AlertRule).filter(
        AlertRule.id == alert_id,
        AlertRule.user_id == current_user.id,
    ).first()
    if not alert_rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    update_data = alert_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(alert_rule, key, value)
    db.commit()
    db.refresh(alert_rule)
    return alert_rule


@router.delete("/alerts/{alert_id}", status_code=204)
async def delete_alert_rule(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert_rule = db.query(AlertRule).filter(
        AlertRule.id == alert_id,
        AlertRule.user_id == current_user.id,
    ).first()
    if not alert_rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    db.delete(alert_rule)
    db.commit()
    return None
