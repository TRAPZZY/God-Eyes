"""
God Eyes - Input Validators
Coordinate validation, file upload validation, XSS prevention.
"""
import re
import os
from typing import Tuple, Optional


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".tiff", ".tif", ".webp"}
ALLOWED_EXPORT_EXTENSIONS = {".geojson", ".json", ".kml", ".gpx", ".csv"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, str]:
    if not (-90 <= latitude <= 90):
        return False, f"Latitude must be between -90 and 90, got {latitude}"
    if not (-180 <= longitude <= 180):
        return False, f"Longitude must be between -180 and 180, got {longitude}"
    return True, "Valid"


def validate_file_upload(filename: str, file_size: int, allowed_extensions: Optional[set] = None) -> Tuple[bool, str]:
    ext = os.path.splitext(filename)[1].lower()
    allowed = allowed_extensions or ALLOWED_IMAGE_EXTENSIONS
    if ext not in allowed:
        return False, f"File extension '{ext}' not allowed. Allowed: {', '.join(sorted(allowed))}"
    if file_size > MAX_FILE_SIZE:
        return False, f"File size {file_size} exceeds maximum {MAX_FILE_SIZE} bytes"
    if file_size == 0:
        return False, "File is empty"
    return True, "Valid"


def sanitize_string(value: str, max_length: int = 1000) -> str:
    value = value.strip()[:max_length]
    value = re.sub(r"<[^>]*>", "", value)
    value = re.sub(r"javascript\s*:", "", value, flags=re.IGNORECASE)
    value = re.sub(r"on\w+\s*=", "", value, flags=re.IGNORECASE)
    return value


def is_safe_filename(filename: str) -> Tuple[bool, str]:
    if not filename:
        return False, "Filename is empty"
    if "/" in filename or "\\" in filename:
        return False, "Filename contains path separators"
    if ".." in filename:
        return False, "Filename contains directory traversal"
    if len(filename) > 255:
        return False, "Filename too long"
    return True, "Valid"
