"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Capture & Change Detection Schemas

Creator: Trapzzy
Contact: traphubs@outlook.com

Pydantic schemas for satellite capture records and AI-analyzed change detections.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class CaptureRequest(BaseModel):
    location_id: uuid.UUID
    resolution: str = Field(default="standard", pattern="^(standard|high|ultra|8k)$")
    style: str = Field(default="satellite", pattern="^(satellite|hybrid|terrain)$")


class CaptureResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    image_url: Optional[str]
    image_path: Optional[str]
    resolution: str
    source: str
    width: Optional[int]
    height: Optional[int]
    zoom_level: Optional[float]
    captured_at: datetime
    cloud_coverage: Optional[float]
    image_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class CaptureListResponse(BaseModel):
    captures: list[CaptureResponse]
    total: int
    page: int
    per_page: int


class ChangeDetectionResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    before_capture_id: uuid.UUID
    after_capture_id: uuid.UUID
    change_score: float
    change_type: Optional[Dict[str, Any]]
    severity: str
    description: Optional[str]
    diff_image_path: Optional[str]
    detected_at: datetime
    alert_sent: bool
    reviewed: bool

    class Config:
        from_attributes = True


class ChangeDetectionSummary(BaseModel):
    total_changes: int
    high_severity: int
    medium_severity: int
    low_severity: int
    recent_changes: list[ChangeDetectionResponse]
