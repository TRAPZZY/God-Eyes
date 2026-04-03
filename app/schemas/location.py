"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Location Schemas

Creator: Trapzzy
Contact: traphubs@outlook.com

Pydantic schemas for location management, geofencing, and annotations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    zoom_level: Optional[float] = Field(default=15.0, ge=1, le=22)
    tags: Optional[str] = None
    notes: Optional[str] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = None
    zoom_level: Optional[float] = Field(None, ge=1, le=22)
    is_monitored: Optional[bool] = None
    tags: Optional[str] = None
    notes: Optional[str] = None


class LocationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    address: Optional[str]
    latitude: float
    longitude: float
    zoom_level: float
    is_monitored: bool
    tags: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class GeofenceCreate(BaseModel):
    location_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    coordinates: str
    alert_on_change: bool = True


class GeofenceResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    name: str
    coordinates: str
    alert_on_change: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnnotationCreate(BaseModel):
    location_id: uuid.UUID
    coordinates: str
    note: Optional[str] = None
    annotation_type: str = "marker"


class AnnotationResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    user_id: uuid.UUID
    coordinates: str
    note: Optional[str]
    annotation_type: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
