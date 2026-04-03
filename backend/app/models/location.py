"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Location & Geofence Models

Creator: Trapzzy
Contact: traphubs@outlook.com

Location model for tracked coordinates with geofencing support
for perimeter-based monitoring and alert boundaries.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    zoom_level = Column(Numeric(5, 2), default=15.0)
    is_monitored = Column(Boolean, default=False, nullable=False)
    tags = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="locations")
    captures = relationship("Capture", back_populates="location", cascade="all, delete-orphan")
    schedules = relationship("MonitoringSchedule", back_populates="location", cascade="all, delete-orphan")
    geofences = relationship("Geofence", back_populates="location", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="location", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Location(id={self.id}, name='{self.name}', lat={self.latitude}, lon={self.longitude})>"


class Geofence(Base):
    __tablename__ = "geofences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    coordinates = Column(Text, nullable=False)
    alert_on_change = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    location = relationship("Location", back_populates="geofences")

    def __repr__(self):
        return f"<Geofence(id={self.id}, location_id={self.location_id}, name='{self.name}')>"


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    coordinates = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    annotation_type = Column(String(50), default="marker")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    location = relationship("Location", back_populates="annotations")
    user = relationship("User", backref="annotations")

    def __repr__(self):
        return f"<Annotation(id={self.id}, location_id={self.location_id}, type='{self.annotation_type}')>"
