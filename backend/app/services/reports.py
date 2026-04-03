"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Report Generation Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Generates HTML and PDF reports with capture history, change detections,
and analysis summaries. Uses weasyprint for PDF conversion when available,
with automatic fallback to HTML-only output.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.capture import Capture, ChangeDetection
from app.models.location import Location
from app.config import get_settings

settings = get_settings()

REPORT_OUTPUT_DIR = os.path.join(settings.UPLOAD_DIR, "reports")

try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except ImportError:
    HAS_WEASYPRINT = False


def _get_location_stats(db: Session, location_id: uuid.UUID, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
    """Gather statistics for a location within a date range."""
    query = db.query(Capture).filter(Capture.location_id == location_id)
    if start:
        query = query.filter(Capture.captured_at >= start)
    if end:
        query = query.filter(Capture.captured_at <= end)

    total_captures = query.count()

    sources = (
        db.query(Capture.source, func.count(Capture.id))
        .filter(Capture.location_id == location_id)
        .group_by(Capture.source)
        .all()
    )
    source_breakdown = {s: c for s, c in sources}

    resolutions = (
        db.query(Capture.resolution, func.count(Capture.id))
        .filter(Capture.location_id == location_id)
        .group_by(Capture.resolution)
        .all()
    )
    resolution_breakdown = {r: c for r, c in resolutions}

    changes_query = db.query(ChangeDetection).filter(ChangeDetection.location_id == location_id)
    if start:
        changes_query = changes_query.filter(ChangeDetection.detected_at >= start)
    if end:
        changes_query = changes_query.filter(ChangeDetection.detected_at <= end)

    total_changes = changes_query.count()
    severity_breakdown = {
        "high": changes_query.filter(ChangeDetection.severity == "high").count(),
        "medium": changes_query.filter(ChangeDetection.severity == "medium").count(),
        "low": changes_query.filter(ChangeDetection.severity == "low").count(),
    }

    avg_change_score = 0.0
    scores = changes_query.all()
    if scores:
        avg_change_score = sum(float(s.change_score) for s in scores) / len(scores)

    first_capture = query.order_by(Capture.captured_at.asc()).first()
    last_capture = query.order_by(Capture.captured_at.desc()).first()

    return {
        "total_captures": total_captures,
        "total_changes": total_changes,
        "source_breakdown": dict(source_breakdown),
        "resolution_breakdown": dict(resolution_breakdown),
        "severity_breakdown": severity_breakdown,
        "avg_change_score": round(avg_change_score, 2),
        "first_capture": first_capture.captured_at.isoformat() if first_capture and first_capture.captured_at else "N/A",
        "last_capture": last_capture.captured_at.isoformat() if last_capture and last_capture.captured_at else "N/A",
    }


def _get_recent_captures(db: Session, location_id: uuid.UUID, limit: int = 10, start: Optional[datetime] = None, end: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Get recent captures for the report."""
    query = db.query(Capture).filter(Capture.location_id == location_id)
    if start:
        query = query.filter(Capture.captured_at >= start)
    if end:
        query = query.filter(Capture.captured_at <= end)

    captures = query.order_by(Capture.captured_at.desc()).limit(limit).all()
    result = []
    for c in captures:
        result.append({
            "id": str(c.id),
            "captured_at": c.captured_at.isoformat() if c.captured_at else "N/A",
            "source": c.source,
            "resolution": c.resolution,
            "cloud_coverage": float(c.cloud_coverage) if c.cloud_coverage else None,
            "has_image": bool(c.image_path),
        })
    return result


def _get_recent_changes(db: Session, location_id: uuid.UUID, limit: int = 10, start: Optional[datetime] = None, end: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Get recent change detections for the report."""
    query = db.query(ChangeDetection).filter(ChangeDetection.location_id == location_id)
    if start:
        query = query.filter(ChangeDetection.detected_at >= start)
    if end:
        query = query.filter(ChangeDetection.detected_at <= end)

    changes = query.order_by(ChangeDetection.detected_at.desc()).limit(limit).all()
    result = []
    for ch in changes:
        result.append({
            "id": str(ch.id),
            "detected_at": ch.detected_at.isoformat() if ch.detected_at else "N/A",
            "severity": ch.severity,
            "change_score": float(ch.change_score),
            "change_type": ch.change_type,
            "description": ch.description,
        })
    return result


def _build_html_report(
    location: Location,
    stats: Dict[str, Any],
    captures: List[Dict[str, Any]],
    changes: List[Dict[str, Any]],
    date_range: Optional[str] = None,
) -> str:
    """Build a complete HTML report string."""
    severity_colors = {"high": "#ef4444", "medium": "#f59e0b", "low": "#22c55e"}

    captures_rows = ""
    for cap in captures:
        cc = f"{cap['cloud_coverage']:.1f}%" if cap["cloud_coverage"] is not None else "N/A"
        captures_rows += f"""
        <tr>
            <td>{cap['captured_at'][:19]}</td>
            <td>{cap['source']}</td>
            <td>{cap['resolution']}</td>
            <td>{cc}</td>
            <td>{'Yes' if cap['has_image'] else 'No'}</td>
        </tr>"""

    changes_rows = ""
    for ch in changes:
        sev_color = severity_colors.get(ch["severity"], "#6b7280")
        ct = ch["change_type"]
        ct_str = ", ".join(ct) if isinstance(ct, list) else str(ct)
        changes_rows += f"""
        <tr>
            <td>{ch['detected_at'][:19]}</td>
            <td><span style="color:{sev_color};font-weight:bold;">{ch['severity'].upper()}</span></td>
            <td>{ch['change_score']:.1f}%</td>
            <td>{ct_str}</td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">{ch.get('description', '')[:120]}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>God Eyes - Intelligence Report: {location.name}</title>
<style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }}
    .container {{ max-width: 1100px; margin: 0 auto; }}
    .header {{ border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }}
    .header h1 {{ color: #3b82f6; font-size: 28px; }}
    .header p {{ color: #94a3b8; margin-top: 4px; }}
    .meta {{ display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; }}
    .meta-item {{ background: #1e293b; padding: 16px 24px; border-radius: 8px; flex: 1; min-width: 150px; }}
    .meta-item .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }}
    .meta-item .value {{ color: #f1f5f9; font-size: 24px; font-weight: bold; margin-top: 4px; }}
    .section {{ margin-bottom: 30px; }}
    .section h2 {{ color: #3b82f6; font-size: 20px; margin-bottom: 16px; border-left: 3px solid #3b82f6; padding-left: 12px; }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }}
    th {{ background: #334155; color: #94a3b8; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }}
    td {{ padding: 10px 16px; border-top: 1px solid #334155; font-size: 14px; }}
    tr:hover td {{ background: #273449; }}
    .footer {{ text-align: center; color: #475569; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>God Eyes -- Intelligence Report</h1>
        <p>Location: {location.name} | Coordinates: {location.latitude}, {location.longitude}</p>
        <p>Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}{(' | Range: ' + date_range) if date_range else ''}</p>
    </div>

    <div class="meta">
        <div class="meta-item">
            <div class="label">Total Captures</div>
            <div class="value">{stats['total_captures']}</div>
        </div>
        <div class="meta-item">
            <div class="label">Changes Detected</div>
            <div class="value">{stats['total_changes']}</div>
        </div>
        <div class="meta-item">
            <div class="label">Avg Change Score</div>
            <div class="value">{stats['avg_change_score']}%</div>
        </div>
        <div class="meta-item">
            <div class="label">High Severity</div>
            <div class="value" style="color:#ef4444;">{stats['severity_breakdown']['high']}</div>
        </div>
    </div>

    <div class="section">
        <h2>Capture History (Recent {len(captures)})</h2>
        <table>
            <thead><tr><th>Captured At</th><th>Source</th><th>Resolution</th><th>Cloud Cover</th><th>Image</th></tr></thead>
            <tbody>{captures_rows if captures_rows else '<tr><td colspan="5" style="text-align:center;color:#64748b;">No captures in range</td></tr>'}</tbody>
        </table>
    </div>

    <div class="section">
        <h2>Change Detections (Recent {len(changes)})</h2>
        <table>
            <thead><tr><th>Detected At</th><th>Severity</th><th>Score</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>{changes_rows if changes_rows else '<tr><td colspan="5" style="text-align:center;color:#64748b;">No changes detected</td></tr>'}</tbody>
        </table>
    </div>

    <div class="footer">
        God Eyes v{settings.APP_VERSION} -- Defense-Grade Satellite Intelligence Platform<br>
        Creator: Trapzzy | traphubs@outlook.com
    </div>
</div>
</body>
</html>"""
    return html


def generate_report(
    db: Session,
    location_id: uuid.UUID,
    fmt: str = "html",
    date_range: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate an intelligence report for a location.

    Args:
        db: SQLAlchemy session.
        location_id: Target location UUID.
        fmt: Output format ('html' or 'pdf').
        date_range: Optional date range string like '2024-01-01:2024-12-31'.

    Returns:
        Dict with file_path, format, and status.
    """
    os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return {"status": "error", "message": "Location not found"}

    start_dt = None
    end_dt = None
    if date_range and ":" in date_range:
        parts = date_range.split(":")
        try:
            start_dt = datetime.fromisoformat(parts[0]).replace(tzinfo=timezone.utc)
            end_dt = datetime.fromisoformat(parts[1]).replace(tzinfo=timezone.utc)
        except (ValueError, IndexError):
            pass

    stats = _get_location_stats(db, location_id, start=start_dt, end=end_dt)
    captures = _get_recent_captures(db, location_id, limit=20, start=start_dt, end=end_dt)
    changes = _get_recent_changes(db, location_id, limit=20, start=start_dt, end=end_dt)

    html_content = _build_html_report(location, stats, captures, changes, date_range)

    output_format = fmt.lower()
    if output_format == "pdf" and HAS_WEASYPRINT:
        output_filename = f"report_{location_id}_{uuid.uuid4().hex[:8]}.pdf"
        output_path = os.path.join(REPORT_OUTPUT_DIR, output_filename)
        HTML(string=html_content).write_pdf(output_path)
        actual_format = "pdf"
    else:
        output_filename = f"report_{location_id}_{uuid.uuid4().hex[:8]}.html"
        output_path = os.path.join(REPORT_OUTPUT_DIR, output_filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        actual_format = "html"

    return {
        "status": "success",
        "file_path": output_path,
        "url": f"/uploads/reports/{output_filename}",
        "format": actual_format,
        "location_id": str(location_id),
        "location_name": location.name,
        "stats": stats,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
