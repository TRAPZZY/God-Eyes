"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Time-lapse Generator Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Compiles sequential satellite captures into animated GIF time-lapse videos.
Uses PIL/Pillow for image compositing -- no ffmpeg dependency required.
Supports configurable FPS, duration windows, and overlay text.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session

from app.models.capture import Capture
from app.models.location import Location
from app.config import get_settings

settings = get_settings()

TIMELAPSE_OUTPUT_DIR = os.path.join(settings.UPLOAD_DIR, "timelapses")

VALID_STYLES = {"gif", "mp4"}

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "C:/Windows/Fonts/arial.ttf",
]


def _get_font(size: int = 18) -> ImageFont.FreeTypeFont:
    """Load a TrueType font, falling back to default if unavailable."""
    for path in FONT_PATHS:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def _add_overlay(frame: Image.Image, text: str, location_name: str) -> Image.Image:
    """Add timestamp and location name overlay to a frame."""
    draw = ImageDraw.Draw(frame)
    font = _get_font(size=16)
    small_font = _get_font(size=12)

    w, h = frame.size

    bar_h = 40
    draw.rectangle([0, h - bar_h, w, h], fill=(0, 0, 0, 180))

    draw.text((10, h - bar_h + 6), location_name, fill=(255, 255, 255), font=font)
    draw.text((10, h - bar_h + 24), text, fill=(180, 180, 180), font=small_font)

    god_eyes_font = _get_font(size=14)
    tw = god_eyes_font.getlength("God Eyes")
    draw.text((w - tw - 12, h - bar_h + 12), "God Eyes", fill=(0, 180, 255), font=god_eyes_font)

    return frame


def _collect_frames(
    db: Session,
    location_id: uuid.UUID,
    duration_days: int = 30,
    max_frames: int = 50,
) -> List[str]:
    """Collect image paths from captures within the duration window."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=duration_days)
    captures = (
        db.query(Capture)
        .filter(
            Capture.location_id == location_id,
            Capture.captured_at >= cutoff,
            Capture.image_path.isnot(None),
        )
        .order_by(Capture.captured_at.asc())
        .all()
    )

    paths = []
    for cap in captures:
        p = cap.image_path
        if p and os.path.isfile(str(p)):
            paths.append(str(p))

    if len(paths) > max_frames:
        step = len(paths) / max_frames
        paths = [paths[int(i * step)] for i in range(max_frames)]

    return paths


def _normalize_frames(frames: List[str], target_size: tuple = (640, 480)) -> List[Image.Image]:
    """Load and normalize all frames to the same dimensions."""
    images: List[Image.Image] = []
    for path in frames:
        try:
            img = Image.open(path).convert("RGB")
            img.thumbnail(target_size, Image.LANCZOS)

            canvas = Image.new("RGB", target_size, (0, 0, 0))
            ox = (target_size[0] - img.width) // 2
            oy = (target_size[1] - img.height) // 2
            canvas.paste(img, (ox, oy))
            images.append(canvas)
        except Exception:
            continue
    return images


def generate_timelapse(
    db: Session,
    location_id: uuid.UUID,
    style: str = "gif",
    fps: int = 5,
    duration_days: int = 30,
) -> Dict[str, Any]:
    """
    Generate an animated GIF time-lapse from sequential captures.

    Args:
        db: SQLAlchemy session.
        location_id: Target location UUID.
        style: Output format ('gif' or 'mp4'). MP4 falls back to GIF.
        fps: Frames per second for the animation.
        duration_days: How many days of captures to include.

    Returns:
        Dict with file_path, frame_count, duration, and status.
    """
    os.makedirs(TIMELAPSE_OUTPUT_DIR, exist_ok=True)

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return {"status": "error", "message": "Location not found"}

    frame_paths = _collect_frames(db, location_id, duration_days=duration_days)
    if len(frame_paths) < 2:
        return {
            "status": "error",
            "message": f"Need at least 2 frames, found {len(frame_paths)}. Increase capture frequency or duration window.",
        }

    images = _normalize_frames(frame_paths)
    if len(images) < 2:
        return {"status": "error", "message": "Failed to load frames for time-lapse"}

    captures = (
        db.query(Capture)
        .filter(Capture.location_id == location_id, Capture.captured_at.isnot(None))
        .order_by(Capture.captured_at.asc())
        .all()
    )
    capture_map = {str(c.image_path): c.captured_at for c in captures if c.image_path}

    for i, img in enumerate(images):
        ts_str = "Frame " + str(i + 1)
        if i < len(frame_paths):
            cap_ts = capture_map.get(frame_paths[i])
            if cap_ts:
                ts_str = cap_ts.strftime("%Y-%m-%d %H:%M UTC")
        _add_overlay(img, ts_str, location.name)

    output_filename = f"timelapse_{location_id}_{uuid.uuid4().hex[:8]}.gif"
    output_path = os.path.join(TIMELAPSE_OUTPUT_DIR, output_filename)

    duration_ms = int(1000 / fps)

    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        duration=duration_ms,
        loop=0,
        optimize=True,
    )

    total_duration = len(images) / fps

    return {
        "status": "success",
        "file_path": output_path,
        "url": f"/uploads/timelapses/{output_filename}",
        "download_url": f"/api/v1/intelligence/timelapse/download/{output_filename}",
        "frame_count": len(images),
        "fps": fps,
        "duration_seconds": round(total_duration, 2),
        "style": "gif",
        "location_id": str(location_id),
        "location_name": location.name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
