"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Monitoring Schedule & Alert Rule Schemas

Creator: Trapzzy
Contact: traphubs@outlook.com

Pydantic schemas for monitoring schedules and alert rule configuration.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from app.models.schedule import ScheduleFrequency, AlertRuleType, NotificationChannel


class ScheduleCreate(BaseModel):
    location_id: uuid.UUID
    frequency: ScheduleFrequency = ScheduleFrequency.DAILY
    capture_resolution: str = Field(default="high", pattern="^(standard|high|ultra)$")
    capture_style: str = Field(default="satellite", pattern="^(satellite|hybrid|terrain)$")


class ScheduleUpdate(BaseModel):
    frequency: Optional[ScheduleFrequency] = None
    capture_resolution: Optional[str] = None
    capture_style: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    frequency: ScheduleFrequency
    capture_resolution: str
    capture_style: str
    next_capture_at: Optional[datetime]
    last_capture_at: Optional[datetime]
    total_captures: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertRuleCreate(BaseModel):
    location_id: uuid.UUID
    rule_type: AlertRuleType = AlertRuleType.CUSTOM
    name: str = Field(..., min_length=1, max_length=255)
    conditions: Optional[Dict[str, Any]] = None
    threshold: Optional[float] = None
    notification_channel: NotificationChannel = NotificationChannel.EMAIL
    notification_target: str


class AlertRuleUpdate(BaseModel):
    rule_type: Optional[AlertRuleType] = None
    name: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    threshold: Optional[float] = None
    notification_channel: Optional[NotificationChannel] = None
    notification_target: Optional[str] = None
    is_active: Optional[bool] = None


class AlertRuleResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    location_id: uuid.UUID
    rule_type: AlertRuleType
    name: str
    conditions: Optional[Dict[str, Any]]
    threshold: Optional[float]
    notification_channel: NotificationChannel
    notification_target: Optional[str]
    is_active: bool
    triggered_count: int
    last_triggered_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
