"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Change Detection Service

Creator: Trapzzy
Contact: traphubs@outlook.com

AI-powered image comparison engine that detects structural changes,
vegetation shifts, vehicle presence, and other anomalies between satellite captures.
Uses structural similarity (SSIM), pixel differencing, and contour analysis.
"""

import numpy as np
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
try:
    from skimage.metrics import structural_similarity as ssim
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from app.models.capture import Capture, ChangeDetection
from app.config import get_settings

settings = get_settings()


def load_image(image_path: str) -> Optional[np.ndarray]:
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    except Exception:
        return None


def resize_to_match(img1: np.ndarray, img2: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]
    target_h = min(h1, h2)
    target_w = min(w1, w2)
    img1_resized = cv2.resize(img1, (target_w, target_h))
    img2_resized = cv2.resize(img2, (target_w, target_h))
    return img1_resized, img2_resized


def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> Tuple[float, np.ndarray]:
    score, diff = ssim(img1, img2, full=True)
    return score, diff


def compute_pixel_difference(img1: np.ndarray, img2: np.ndarray) -> float:
    diff = cv2.absdiff(img1, img2)
    return np.mean(diff)


def detect_contours(img1: np.ndarray, img2: np.ndarray) -> int:
    diff = cv2.absdiff(img1, img2)
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    significant_contours = [c for c in contours if cv2.contourArea(c) > 100]
    return len(significant_contours)


def classify_change_type(contour_count: int, pixel_diff: float, ssim_score: float) -> Dict[str, Any]:
    change_types = []
    if contour_count > 10:
        change_types.append("major_structural_change")
    elif contour_count > 3:
        change_types.append("minor_structural_change")
    if pixel_diff > 50:
        change_types.append("significant_pixel_change")
    if ssim_score < 0.7:
        change_types.append("high_dissimilarity")
    if not change_types:
        change_types.append("minimal_change")
    return {"types": change_types, "contour_count": contour_count}


def get_severity(ssim_score: float, pixel_diff: float, contour_count: int) -> str:
    if ssim_score < 0.5 or contour_count > 15:
        return "high"
    elif ssim_score < 0.7 or contour_count > 5:
        return "medium"
    return "low"


def generate_diff_image(img1: np.ndarray, img2: np.ndarray, output_path: str) -> bool:
    try:
        diff = cv2.absdiff(img1, img2)
        _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        diff_colored = cv2.applyColorMap(diff, cv2.COLORMAP_HOT)
        mask = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
        highlighted = cv2.bitwise_and(diff_colored, mask)
        cv2.imwrite(output_path, highlighted)
        return True
    except Exception:
        return False


def analyze_changes(
    db: Session,
    location_id: uuid.UUID,
    before_capture: Capture,
    after_capture: Capture,
) -> Optional[ChangeDetection]:
    before_path = before_capture.image_path if before_capture.image_path is not None else None
    after_path = after_capture.image_path if after_capture.image_path is not None else None
    if before_path is None or after_path is None:
        return None
    img1 = load_image(str(before_path))
    img2 = load_image(str(after_path))
    if img1 is None or img2 is None:
        return None
    img1, img2 = resize_to_match(img1, img2)
    ssim_score, diff_map = compute_ssim(img1, img2)
    pixel_diff = compute_pixel_difference(img1, img2)
    contour_count = detect_contours(img1, img2)
    change_type = classify_change_type(contour_count, pixel_diff, ssim_score)
    severity = get_severity(ssim_score, pixel_diff, contour_count)
    change_score = round((1 - ssim_score) * 100, 2)
    diff_image_path = None
    if severity in ("medium", "high"):
        import os
        diff_dir = os.path.join(settings.UPLOAD_DIR, "diffs", str(location_id))
        os.makedirs(diff_dir, exist_ok=True)
        diff_image_path = os.path.join(diff_dir, f"{uuid.uuid4()}_diff.png")
        generate_diff_image(img1, img2, diff_image_path)
    description = f"Change score: {change_score}%. SSIM: {ssim_score:.4f}. Detected {contour_count} significant change regions. Types: {', '.join(change_type['types'])}."
    change_detection = ChangeDetection(
        location_id=location_id,
        before_capture_id=before_capture.id,
        after_capture_id=after_capture.id,
        change_score=change_score,
        change_type=change_type,
        severity=severity,
        description=description,
        diff_image_path=diff_image_path,
        detected_at=datetime.now(timezone.utc),
    )
    db.add(change_detection)
    db.commit()
    db.refresh(change_detection)
    return change_detection
