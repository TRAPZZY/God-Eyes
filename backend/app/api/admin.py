"""
God Eyes - Admin Panel API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import uuid
import os
import logging
import psutil
import shutil

from app.database import get_db
from app.models.user import User, UserRole
from app.models.location import Location
from app.models.capture import Capture, ChangeDetection
from app.models.schedule import MonitoringSchedule
from app.core.security import get_current_user, require_role

router = APIRouter()
logger = logging.getLogger("godeyes.admin")


@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role.value,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role:
        try:
            user.role = UserRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active,
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_locations = db.query(Location).count()
    total_captures = db.query(Capture).count()
    total_changes = db.query(ChangeDetection).count()
    total_schedules = db.query(MonitoringSchedule).count()
    active_schedules = db.query(MonitoringSchedule).filter(MonitoringSchedule.is_active == True).count()
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_locations": total_locations,
        "total_captures": total_captures,
        "total_changes": total_changes,
        "total_schedules": total_schedules,
        "active_schedules": active_schedules,
    }


@router.get("/health")
async def get_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    db_status = "healthy"
    try:
        db.query(func.count(User.id)).scalar()
    except Exception:
        db_status = "unhealthy"

    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    disk = shutil.disk_usage("/")

    return {
        "status": "healthy",
        "database": db_status,
        "memory": {
            "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
            "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
        },
        "cpu_percent": process.cpu_percent(),
        "disk": {
            "total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
            "used_gb": round(disk.used / 1024 / 1024 / 1024, 2),
            "free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
            "percent_used": round(disk.used / disk.total * 100, 2),
        },
        "pid": os.getpid(),
    }


@router.get("/logs")
async def get_recent_logs(
    lines: int = Query(100, ge=1, le=1000),
    level: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
):
    log_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", "logs", "godeyes.log")
    if not os.path.exists(log_file):
        return {"logs": [], "message": "No log file found"}
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        recent = all_lines[-lines:]
        if level:
            recent = [l for l in recent if level.upper() in l.upper()]
        return {"logs": [l.strip() for l in recent], "count": len(recent)}
    except Exception as e:
        return {"logs": [], "error": str(e)}
