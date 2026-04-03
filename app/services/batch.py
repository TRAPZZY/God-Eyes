"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Batch Processing Service

Creator: Trapzzy
Contact: traphubs@outlook.com

CSV processing for bulk location import with validation,
geocoding, and error reporting.
"""

import csv
import io
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid

from sqlalchemy.orm import Session

from app.models.location import Location
from app.services.geocoding import geocode_raw_address


REQUIRED_COLUMNS = {"name", "latitude", "longitude"}
OPTIONAL_COLUMNS = {"address", "zoom_level", "tags", "notes"}
ALL_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS


def validate_csv_format(content: str) -> Tuple[bool, List[str]]:
    """
    Validate CSV content has the required columns and proper format.

    Args:
        content: Raw CSV string content

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    try:
        reader = csv.DictReader(io.StringIO(content))
        if reader.fieldnames is None:
            errors.append("CSV file is empty or has no header row")
            return False, errors

        header_set = {col.strip().lower() for col in reader.fieldnames}
        missing = REQUIRED_COLUMNS - header_set
        if missing:
            errors.append(f"Missing required columns: {', '.join(sorted(missing))}")

        unknown = header_set - ALL_COLUMNS
        if unknown:
            errors.append(f"Unknown columns will be ignored: {', '.join(sorted(unknown))}")

    except csv.Error as e:
        errors.append(f"CSV parsing error: {str(e)}")

    return len(errors) == 0, errors


def parse_csv(content: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parse CSV content into location records with validation.

    Args:
        content: Raw CSV string content

    Returns:
        Tuple of (valid_records, error_records)
    """
    valid_records = []
    error_records = []

    reader = csv.DictReader(io.StringIO(content))

    for row_num, row in enumerate(reader, start=2):
        normalized = {k.strip().lower(): v.strip() if v else "" for k, v in row.items() if k}

        record, errors = _validate_row(normalized, row_num)
        if errors:
            error_records.append({
                "row": row_num,
                "data": dict(normalized),
                "errors": errors,
            })
        else:
            valid_records.append(record)

    return valid_records, error_records


def _validate_row(row: Dict[str, str], row_num: int) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """
    Validate a single CSV row and return a parsed location dict.

    Args:
        row: Normalized row data
        row_num: Row number for error reporting

    Returns:
        Tuple of (parsed_record or None, list of error messages)
    """
    errors = []

    name = row.get("name", "").strip()
    if not name:
        errors.append("Name is required")

    lat_str = row.get("latitude", "").strip()
    lon_str = row.get("longitude", "").strip()

    try:
        latitude = float(lat_str)
        if latitude < -90 or latitude > 90:
            errors.append(f"Latitude {latitude} out of range (-90 to 90)")
    except (ValueError, TypeError):
        errors.append(f"Invalid latitude: {lat_str}")
        latitude = None

    try:
        longitude = float(lon_str)
        if longitude < -180 or longitude > 180:
            errors.append(f"Longitude {longitude} out of range (-180 to 180)")
    except (ValueError, TypeError):
        errors.append(f"Invalid longitude: {lon_str}")
        longitude = None

    if errors:
        return None, errors

    zoom_level = 15.0
    zoom_str = row.get("zoom_level", "").strip()
    if zoom_str:
        try:
            zoom_level = float(zoom_str)
            if zoom_level < 1 or zoom_level > 22:
                errors.append(f"Zoom level {zoom_level} out of range (1-22)")
                zoom_level = 15.0
        except (ValueError, TypeError):
            errors.append(f"Invalid zoom level: {zoom_str}")

    return {
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "address": row.get("address", "").strip() or None,
        "zoom_level": zoom_level,
        "tags": row.get("tags", "").strip() or None,
        "notes": row.get("notes", "").strip() or None,
    }, errors


def geocode_batch_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Attempt to geocode records that have an address but no coordinates.
    Records with valid coordinates are passed through unchanged.

    Args:
        records: List of parsed location records

    Returns:
        Updated list with geocoded coordinates where possible
    """
    for record in records:
        if record["latitude"] is not None and record["longitude"] is not None:
            continue

        address = record.get("address")
        if address:
            geo_result = geocode_raw_address(address)
            if geo_result:
                record["latitude"] = geo_result["latitude"]
                record["longitude"] = geo_result["longitude"]
                if not record.get("address"):
                    record["address"] = geo_result.get("address")

    return records


def import_locations(
    db: Session,
    user_id: uuid.UUID,
    records: List[Dict[str, Any]],
) -> Tuple[List[Location], List[Dict[str, Any]]]:
    """
    Bulk import locations into the database.

    Args:
        db: Database session
        user_id: User ID to associate locations with
        records: List of validated location records

    Returns:
        Tuple of (created_locations, failed_imports)
    """
    created = []
    failed = []

    for record in records:
        try:
            location = Location(
                user_id=user_id,
                name=record["name"],
                address=record.get("address"),
                latitude=record["latitude"],
                longitude=record["longitude"],
                zoom_level=record.get("zoom_level", 15.0),
                tags=record.get("tags"),
                notes=record.get("notes"),
            )
            db.add(location)
            created.append(location)
        except Exception as e:
            failed.append({
                "record": record,
                "error": str(e),
            })

    if created:
        db.commit()
        for loc in created:
            db.refresh(loc)

    return created, failed


def process_csv_import(
    db: Session,
    user_id: uuid.UUID,
    csv_content: str,
    skip_geocoding: bool = False,
) -> Dict[str, Any]:
    """
    Full pipeline: validate, parse, geocode, and import CSV data.

    Args:
        db: Database session
        user_id: User ID to associate locations with
        csv_content: Raw CSV string
        skip_geocoding: If True, skip address geocoding step

    Returns:
        Dictionary with import results summary
    """
    start_time = datetime.now(timezone.utc)

    is_valid, format_errors = validate_csv_format(csv_content)
    if not is_valid:
        return {
            "status": "failed",
            "errors": format_errors,
            "total_rows": 0,
            "imported": 0,
            "failed": 0,
            "geocoded": 0,
            "parse_errors": [],
            "import_errors": [],
            "processed_at": start_time.isoformat(),
        }

    valid_records, parse_errors = parse_csv(csv_content)

    geocoded_count = 0
    if not skip_geocoding:
        records_needing_geocoding = [
            r for r in valid_records
            if r["latitude"] is None or r["longitude"] is None
        ]
        if records_needing_geocoding:
            geocoded_records = geocode_batch_records(records_needing_geocoding)
            geocoded_count = sum(
                1 for r in geocoded_records
                if r["latitude"] is not None and r["longitude"] is not None
            )

    created_locations, import_errors = import_locations(db, user_id, valid_records)

    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()

    return {
        "status": "completed",
        "total_rows": len(valid_records) + len(parse_errors),
        "valid_rows": len(valid_records),
        "imported": len(created_locations),
        "failed": len(import_errors),
        "geocoded": geocoded_count,
        "parse_errors": parse_errors,
        "import_errors": import_errors,
        "duration_seconds": round(duration, 3),
        "processed_at": end_time.isoformat(),
        "locations": [
            {
                "id": str(loc.id),
                "name": loc.name,
                "latitude": float(loc.latitude),
                "longitude": float(loc.longitude),
            }
            for loc in created_locations
        ],
    }


def generate_csv_template() -> str:
    """
    Generate a CSV template file with headers and a sample row.

    Returns:
        CSV string with headers and example data
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "latitude", "longitude", "address", "zoom_level", "tags", "notes"])
    writer.writerow(["Example Location", "40.7128", "-74.0060", "New York, NY", "15", "urban,example", "Sample entry"])
    return output.getvalue()
