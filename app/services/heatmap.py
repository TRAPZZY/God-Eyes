"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Heatmap Generation Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Generates heatmap images from change detection data.
Uses PIL to create colored overlay images that visualize
change intensity across monitored locations.
"""

import os
import uuid
import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple

from PIL import Image, ImageDraw
from sqlalchemy.orm import Session

from app.models.capture import ChangeDetection
from app.models.location import Location
from app.config import get_settings

settings = get_settings()

HEATMAP_OUTPUT_DIR = os.path.join(settings.UPLOAD_DIR, "heatmaps")

HEATMAP_COLORS = [
    (0, 0, 255),
    (0, 128, 255),
    (0, 255, 255),
    (0, 255, 128),
    (0, 255, 0),
    (128, 255, 0),
    (255, 255, 0),
    (255, 128, 0),
    (255, 64, 0),
    (255, 0, 0),
]


def _intensity_to_color(intensity: float) -> Tuple[int, int, int]:
    """
    Map a 0-1 intensity value to a heatmap color.

    Uses the HEATMAP_COLORS gradient for smooth transitions
    from blue (low) through green/yellow to red (high).
    """
    intensity = max(0.0, min(1.0, intensity))
    idx = intensity * (len(HEATMAP_COLORS) - 1)
    lower = int(math.floor(idx))
    upper = min(lower + 1, len(HEATMAP_COLORS) - 1)
    frac = idx - lower

    c1 = HEATMAP_COLORS[lower]
    c2 = HEATMAP_COLORS[upper]

    r = int(c1[0] + (c2[0] - c1[0]) * frac)
    g = int(c1[1] + (c2[1] - c1[1]) * frac)
    b = int(c1[2] + (c2[2] - c1[2]) * frac)

    return (r, g, b)


def _get_change_points(
    db: Session,
    location_id: uuid.UUID,
    days: int = 90,
) -> List[Dict[str, Any]]:
    """
    Retrieve change detection data for heatmap generation.

    Returns a list of dicts with normalized position and intensity.
    """
    from datetime import timedelta

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    changes = (
        db.query(ChangeDetection)
        .filter(
            ChangeDetection.location_id == location_id,
            ChangeDetection.detected_at >= cutoff,
        )
        .order_by(ChangeDetection.detected_at.desc())
        .all()
    )

    points = []
    for ch in changes:
        severity_score = {"low": 0.2, "medium": 0.5, "high": 0.9}.get(ch.severity, 0.3)
        normalized_score = min(1.0, float(ch.change_score) / 100.0)
        intensity = (severity_score + normalized_score) / 2.0

        points.append({
            "change_id": str(ch.id),
            "intensity": intensity,
            "severity": ch.severity,
            "change_score": float(ch.change_score),
            "detected_at": ch.detected_at.isoformat() if ch.detected_at else "",
        })

    return points


def _generate_base_image(width: int = 800, height: int = 600) -> Image.Image:
    """Create a dark base image for the heatmap overlay."""
    img = Image.new("RGB", (width, height), (15, 23, 42))
    return img


def _draw_heatmap_overlay(
    base: Image.Image,
    points: List[Dict[str, Any]],
    radius: int = 40,
) -> Image.Image:
    """
    Draw a heatmap overlay on the base image.

    Each change detection point is rendered as a radial gradient
    blob colored by intensity.
    """
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    if not points:
        base_rgba = base.convert("RGBA")
        return base_rgba

    for point in points:
        cx = hash(point["change_id"]) % base.width
        cy = (hash(point["change_id"]) >> 16) % base.height

        intensity = point["intensity"]
        color = _intensity_to_color(intensity)

        for r in range(radius, 0, -2):
            alpha = int(180 * (r / radius) * intensity)
            if alpha < 5:
                continue
            draw.ellipse(
                [cx - r, cy - r, cx + r, cy + r],
                fill=(*color, alpha),
            )

    result = Image.alpha_composite(base.convert("RGBA"), overlay)
    return result


def _draw_legend(img: Image.Image) -> Image.Image:
    """Add a color legend to the bottom of the heatmap."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    legend_w = 200
    legend_h = 16
    legend_x = w - legend_w - 20
    legend_y = h - legend_h - 15

    for i in range(legend_w):
        intensity = i / legend_w
        color = _intensity_to_color(intensity)
        draw.line(
            [(legend_x + i, legend_y), (legend_x + i, legend_y + legend_h)],
            fill=color,
        )

    draw.rectangle(
        [legend_x - 2, legend_y - 2, legend_x + legend_w + 2, legend_y + legend_h + 2],
        outline=(100, 116, 139),
        width=1,
    )

    try:
        from PIL import ImageFont
        font_paths = [
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        font = None
        for fp in font_paths:
            try:
                font = ImageFont.truetype(fp, 10)
                break
            except (IOError, OSError):
                continue
        if font is None:
            font = ImageFont.load_default()

        draw.text((legend_x, legend_y - 14), "Low", fill=(100, 180, 255), font=font)
        draw.text((legend_x + legend_w - 25, legend_y - 14), "High", fill=(255, 80, 80), font=font)
    except Exception:
        pass

    return img


def generate_heatmap(
    db: Session,
    location_id: uuid.UUID,
    width: int = 800,
    height: int = 600,
    radius: int = 40,
    days: int = 90,
) -> Dict[str, Any]:
    """
    Generate a heatmap image visualizing change intensity for a location.

    Args:
        db: SQLAlchemy session.
        location_id: Target location UUID.
        width: Output image width in pixels.
        height: Output image height in pixels.
        radius: Radius of each heatmap blob in pixels.
        days: Number of days of change data to include.

    Returns:
        Dict with file_path, point_count, and status.
    """
    os.makedirs(HEATMAP_OUTPUT_DIR, exist_ok=True)

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return {"status": "error", "message": "Location not found"}

    points = _get_change_points(db, location_id, days=days)

    base = _generate_base_image(width, height)
    heatmap = _draw_heatmap_overlay(base, points, radius=radius)
    heatmap = _draw_legend(heatmap)

    output_filename = f"heatmap_{location_id}_{uuid.uuid4().hex[:8]}.png"
    output_path = os.path.join(HEATMAP_OUTPUT_DIR, output_filename)

    heatmap.save(output_path, "PNG", optimize=True)

    severity_counts = {"low": 0, "medium": 0, "high": 0}
    for p in points:
        sev = p.get("severity", "low")
        if sev in severity_counts:
            severity_counts[sev] += 1

    return {
        "status": "success",
        "file_path": output_path,
        "url": f"/uploads/heatmaps/{output_filename}",
        "location_id": str(location_id),
        "location_name": location.name,
        "point_count": len(points),
        "severity_counts": severity_counts,
        "dimensions": {"width": width, "height": height},
        "days_covered": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
