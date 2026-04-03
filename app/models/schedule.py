"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Monitoring Schedule & Alert Rule Models

Creator: Trapzzy
Contact: traphubs@outlook.com

MonitoringSchedule defines recurring capture intervals for locations.
AlertRule defines user-configurable conditions that trigger notifications.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Integer, Float, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ScheduleFrequency(str, enum.Enum):
    """Capture frequency options."""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class AlertRuleType(str, enum.Enum):
    """Types of alert conditions."""
    NEW_CONSTRUCTION = "new_construction"
    VEHICLE_DETECTED = "vehicle_detected"
    VEGETATION_LOSS = "vegetation_loss"
    VEGETATION_GAIN = "vegetation_gain"
    WATER_CHANGE = "water_change"
    STRUCTURE_REMOVED = "structure_removed"
    CUSTOM = "custom"


class NotificationChannel(str, enum.Enum):
    """Alert delivery channels."""
    EMAIL = "email"
    WEBHOOK = "webhook"
    PUSH = "push"


class MonitoringSchedule(Base):
    __tablename__ = "monitoring_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True)
    frequency = Column(SAEnum(ScheduleFrequency, values_callable=lambda e: [x.value for x in e]), default=ScheduleFrequency.DAILY, nullable=False)
    capture_resolution = Column(String(50), default="high")
    capture_style = Column(String(50), default="satellite")
    next_capture_at = Column(DateTime(timezone=True), nullable=True)
    last_capture_at = Column(DateTime(timezone=True), nullable=True)
    total_captures = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    location = relationship("Location", back_populates="schedules")

    def __repr__(self):
        return f"<MonitoringSchedule(id={self.id}, location_id={self.location_id}, frequency='{self.frequency}')>"


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True)
    rule_type = Column(SAEnum(AlertRuleType, values_callable=lambda e: [x.value for x in e]), default=AlertRuleType.CUSTOM, nullable=False)
    name = Column(String(255), nullable=False)
    conditions = Column(JSON, nullable=True)
    threshold = Column(Float, nullable=True)
    notification_channel = Column(SAEnum(NotificationChannel, values_callable=lambda e: [x.value for x in e]), default=NotificationChannel.EMAIL, nullable=False)
    notification_target = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    triggered_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="alert_rules")
    location = relationship("Location", backref="alert_rules")

    def __repr__(self):
        return f"<AlertRule(id={self.id}, type='{self.rule_type}', target='{self.notification_target}')>"
