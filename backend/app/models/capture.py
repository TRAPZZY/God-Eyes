"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Capture & Change Detection Models

Creator: Trapzzy
Contact: traphubs@outlook.com

Capture model stores all satellite imagery records with metadata.
ChangeDetection model tracks AI-analyzed differences between captures.
"""

from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base
from app.models.guid import GUID


class Capture(Base):
    __tablename__ = "captures"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    location_id = Column(GUID(), ForeignKey("locations.id"), nullable=False, index=True)
    image_url = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    resolution = Column(String(50), default="standard")
    source = Column(String(50), default="mapbox", nullable=False)
    width = Column(Numeric(6, 0), nullable=True)
    height = Column(Numeric(6, 0), nullable=True)
    zoom_level = Column(Numeric(5, 2), nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=False)
    cloud_coverage = Column(Numeric(5, 2), nullable=True)
    image_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    location = relationship("Location", back_populates="captures")
    change_detections_before = relationship(
        "ChangeDetection",
        foreign_keys="ChangeDetection.before_capture_id",
        back_populates="before_capture"
    )
    change_detections_after = relationship(
        "ChangeDetection",
        foreign_keys="ChangeDetection.after_capture_id",
        back_populates="after_capture"
    )

    def __repr__(self):
        return f"<Capture(id={self.id}, location_id={self.location_id}, source='{self.source}')>"


class ChangeDetection(Base):
    __tablename__ = "change_detections"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    location_id = Column(GUID(), ForeignKey("locations.id"), nullable=False, index=True)
    before_capture_id = Column(GUID(), ForeignKey("captures.id"), nullable=False)
    after_capture_id = Column(GUID(), ForeignKey("captures.id"), nullable=False)
    change_score = Column(Numeric(5, 2), nullable=False)
    change_type = Column(JSON, nullable=True)
    severity = Column(String(20), default="low")
    description = Column(Text, nullable=True)
    diff_image_path = Column(String(500), nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    alert_sent = Column(Boolean, default=False, nullable=False)
    reviewed = Column(Boolean, default=False, nullable=False)

    location = relationship("Location", backref="change_detections")
    before_capture = relationship(
        "Capture",
        foreign_keys=[before_capture_id],
        back_populates="change_detections_before"
    )
    after_capture = relationship(
        "Capture",
        foreign_keys=[after_capture_id],
        back_populates="change_detections_after"
    )

    def __repr__(self):
        return f"<ChangeDetection(id={self.id}, score={self.change_score}, severity='{self.severity}')>"
