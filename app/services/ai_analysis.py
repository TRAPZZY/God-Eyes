"""
God Eyes - Defense-Grade Satellite Intelligence Platform
AI Analysis Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Basic image analysis using PIL and numpy for object detection
and land use classification on satellite imagery.
"""

import os
import io
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

import numpy as np

from app.config import get_settings

settings = get_settings()


# ============================================================
# Land Use Classification
# ============================================================

# RGB thresholds for common land cover types (approximate)
LAND_COVER_THRESHOLDS = {
    "water": {
        "r_max": 80,
        "g_max": 120,
        "b_min": 100,
        "b_g_diff_min": 20,
    },
    "vegetation": {
        "g_r_diff_min": 10,
        "g_b_diff_min": 10,
        "g_min": 60,
    },
    "urban": {
        "r_range": (80, 200),
        "g_range": (80, 200),
        "b_range": (80, 200),
        "max_diff": 50,
    },
    "bare_soil": {
        "r_min": 120,
        "g_min": 100,
        "r_g_diff_max": 30,
        "b_max": 120,
    },
    "snow_ice": {
        "r_min": 200,
        "g_min": 200,
        "b_min": 200,
        "max_diff": 30,
    },
}


def classify_land_use(
    image_path: Optional[str] = None,
    image_data: Optional[bytes] = None,
    sample_size: int = 256,
) -> Dict[str, Any]:
    """
    Classify land use types in a satellite image using color-based analysis.

    Args:
        image_path: Path to the image file
        image_data: Raw image bytes (alternative to path)
        sample_size: Resize dimension for analysis (performance optimization)

    Returns:
        Dictionary with land use classification results
    """
    if not HAS_PIL:
        return {"error": "PIL (Pillow) is not installed"}

    img = _load_image(image_path, image_data)
    if img is None:
        return {"error": "Failed to load image"}

    img_resized = img.resize((sample_size, sample_size), Image.Resampling.LANCZOS)
    rgb_array = np.array(img_resized)

    if len(rgb_array.shape) != 3 or rgb_array.shape[2] < 3:
        return {"error": "Image must be RGB format"}

    r = rgb_array[:, :, 0].astype(np.float64)
    g = rgb_array[:, :, 1].astype(np.float64)
    b = rgb_array[:, :, 2].astype(np.float64)

    total_pixels = r.size

    water_mask = (
        (r < LAND_COVER_THRESHOLDS["water"]["r_max"])
        & (g < LAND_COVER_THRESHOLDS["water"]["g_max"])
        & (b > LAND_COVER_THRESHOLDS["water"]["b_min"])
        & ((b - g) > LAND_COVER_THRESHOLDS["water"]["b_g_diff_min"])
    )

    vegetation_mask = (
        ((g - r) > LAND_COVER_THRESHOLDS["vegetation"]["g_r_diff_min"])
        & ((g - b) > LAND_COVER_THRESHOLDS["vegetation"]["g_b_diff_min"])
        & (g > LAND_COVER_THRESHOLDS["vegetation"]["g_min"])
    )

    urban_mask = (
        (r > LAND_COVER_THRESHOLDS["urban"]["r_range"][0])
        & (r < LAND_COVER_THRESHOLDS["urban"]["r_range"][1])
        & (g > LAND_COVER_THRESHOLDS["urban"]["g_range"][0])
        & (g < LAND_COVER_THRESHOLDS["urban"]["g_range"][1])
        & (b > LAND_COVER_THRESHOLDS["urban"]["b_range"][0])
        & (b < LAND_COVER_THRESHOLDS["urban"]["b_range"][1])
        & (np.abs(r - g) < LAND_COVER_THRESHOLDS["urban"]["max_diff"])
        & (np.abs(g - b) < LAND_COVER_THRESHOLDS["urban"]["max_diff"])
    )

    bare_soil_mask = (
        (r > LAND_COVER_THRESHOLDS["bare_soil"]["r_min"])
        & (g > LAND_COVER_THRESHOLDS["bare_soil"]["g_min"])
        & (np.abs(r.astype(int) - g.astype(int)) < LAND_COVER_THRESHOLDS["bare_soil"]["r_g_diff_max"])
        & (b < LAND_COVER_THRESHOLDS["bare_soil"]["b_max"])
    )

    snow_ice_mask = (
        (r > LAND_COVER_THRESHOLDS["snow_ice"]["r_min"])
        & (g > LAND_COVER_THRESHOLDS["snow_ice"]["g_min"])
        & (b > LAND_COVER_THRESHOLDS["snow_ice"]["b_min"])
        & (np.abs(r.astype(int) - g.astype(int)) < LAND_COVER_THRESHOLDS["snow_ice"]["max_diff"])
    )

    classified = np.zeros_like(r, dtype=int)
    classified[water_mask] = 1
    classified[vegetation_mask] = 2
    classified[urban_mask] = 3
    classified[bare_soil_mask] = 4
    classified[snow_ice_mask] = 5

    water_pct = float(np.sum(classified == 1)) / total_pixels * 100
    vegetation_pct = float(np.sum(classified == 2)) / total_pixels * 100
    urban_pct = float(np.sum(classified == 3)) / total_pixels * 100
    bare_soil_pct = float(np.sum(classified == 4)) / total_pixels * 100
    snow_ice_pct = float(np.sum(classified == 5)) / total_pixels * 100
    unclassified_pct = 100.0 - (water_pct + vegetation_pct + urban_pct + bare_soil_pct + snow_ice_pct)

    dominant_type = max(
        [
            ("water", water_pct),
            ("vegetation", vegetation_pct),
            ("urban", urban_pct),
            ("bare_soil", bare_soil_pct),
            ("snow_ice", snow_ice_pct),
            ("unclassified", unclassified_pct),
        ],
        key=lambda x: x[1],
    )

    return {
        "land_use": {
            "water": round(water_pct, 2),
            "vegetation": round(vegetation_pct, 2),
            "urban": round(urban_pct, 2),
            "bare_soil": round(bare_soil_pct, 2),
            "snow_ice": round(snow_ice_pct, 2),
            "unclassified": round(max(unclassified_pct, 0), 2),
        },
        "dominant_type": dominant_type[0],
        "dominant_percentage": round(dominant_type[1], 2),
        "image_dimensions": {"width": img.width, "height": img.height},
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# Object Detection (Basic)
# ============================================================

def detect_objects(
    image_path: Optional[str] = None,
    image_data: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Perform basic object detection using edge detection and contour analysis.
    Detects potential structures, vehicles, and linear features.

    Args:
        image_path: Path to the image file
        image_data: Raw image bytes

    Returns:
        Dictionary with detected objects and their properties
    """
    if not HAS_PIL:
        return {"error": "PIL (Pillow) is not installed"}

    img = _load_image(image_path, image_data)
    if img is None:
        return {"error": "Failed to load image"}

    gray = img.convert("L")
    gray_array = np.array(gray, dtype=np.float64)

    edges = _compute_edges(gray_array)

    objects = _find_structures(edges, gray_array)

    brightness = float(np.mean(gray_array))
    contrast = float(np.std(gray_array))

    texture_variance = _compute_texture(gray_array)

    return {
        "detected_objects": objects,
        "object_count": len(objects),
        "image_properties": {
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "texture_variance": round(texture_variance, 2),
            "dimensions": {"width": img.width, "height": img.height},
        },
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


def _compute_edges(gray_array: np.ndarray) -> np.ndarray:
    """Compute edge map using Sobel operators."""
    sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
    sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])

    edges_x = _convolve2d(gray_array, sobel_x)
    edges_y = _convolve2d(gray_array, sobel_y)

    return np.sqrt(edges_x ** 2 + edges_y ** 2)


def _convolve2d(image: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    """Simple 2D convolution."""
    kh, kw = kernel.shape
    ih, iw = image.shape
    pad_h, pad_w = kh // 2, kw // 2

    padded = np.pad(image, ((pad_h, pad_h), (pad_w, pad_w)), mode="constant")
    output = np.zeros_like(image)

    for i in range(ih):
        for j in range(iw):
            region = padded[i:i + kh, j:j + kw]
            output[i, j] = np.sum(region * kernel)

    return output


def _find_structures(
    edges: np.ndarray,
    gray: np.ndarray,
) -> List[Dict[str, Any]]:
    """
    Find potential structures in the edge map using block analysis.
    Divides the image into blocks and analyzes each for structural features.
    """
    h, w = edges.shape
    block_size = max(h, w) // 16
    block_size = max(block_size, 8)

    objects = []

    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            block_edges = edges[y:y + block_size, x:x + block_size]
            block_gray = gray[y:y + block_size, x:x + block_size]

            edge_density = float(np.mean(block_edges > np.mean(block_edges) * 1.5))
            brightness = float(np.mean(block_gray))
            contrast = float(np.std(block_gray))

            obj_type = _classify_block(edge_density, brightness, contrast)

            if obj_type != "empty":
                objects.append({
                    "type": obj_type,
                    "confidence": round(min(edge_density * 2, 1.0), 2),
                    "position": {
                        "x": int(x),
                        "y": int(y),
                        "width": block_size,
                        "height": block_size,
                    },
                    "properties": {
                        "edge_density": round(edge_density, 4),
                        "brightness": round(brightness, 2),
                        "contrast": round(contrast, 2),
                    },
                })

    return objects


def _classify_block(edge_density: float, brightness: float, contrast: float) -> str:
    """Classify a block based on its visual properties."""
    if edge_density < 0.05:
        return "empty"
    if edge_density > 0.3 and contrast > 40:
        return "structure"
    if edge_density > 0.15 and brightness < 100:
        return "vehicle"
    if edge_density > 0.1 and contrast < 30:
        return "vegetation"
    if 0.05 < edge_density < 0.2:
        return "linear_feature"
    return "unknown"


def _compute_texture(gray_array: np.ndarray) -> float:
    """Compute texture variance using local variance analysis."""
    h, w = gray_array.shape
    block = 8
    variances = []

    for y in range(0, h - block, block):
        for x in range(0, w - block, block):
            region = gray_array[y:y + block, x:x + block]
            variances.append(float(np.var(region)))

    return float(np.mean(variances)) if variances else 0.0


# ============================================================
# Image Quality Analysis
# ============================================================

def analyze_image_quality(
    image_path: Optional[str] = None,
    image_data: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Analyze satellite image quality metrics.

    Args:
        image_path: Path to the image file
        image_data: Raw image bytes

    Returns:
        Dictionary with quality metrics
    """
    if not HAS_PIL:
        return {"error": "PIL (Pillow) is not installed"}

    img = _load_image(image_path, image_data)
    if img is None:
        return {"error": "Failed to load image"}

    gray = np.array(img.convert("L"), dtype=np.float64)

    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    laplacian_kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
    laplacian = _convolve2d(gray, laplacian_kernel)
    sharpness = float(np.mean(np.abs(laplacian)))

    is_blurry = sharpness < 50
    is_overexposed = brightness > 220
    is_underexposed = brightness < 40
    is_low_contrast = contrast < 20

    quality_score = 100.0
    if is_blurry:
        quality_score -= 40
    if is_overexposed:
        quality_score -= 25
    if is_underexposed:
        quality_score -= 25
    if is_low_contrast:
        quality_score -= 20

    quality_score = max(0, min(100, quality_score))

    if quality_score >= 80:
        rating = "excellent"
    elif quality_score >= 60:
        rating = "good"
    elif quality_score >= 40:
        rating = "fair"
    else:
        rating = "poor"

    return {
        "quality_score": round(quality_score, 1),
        "quality_rating": rating,
        "metrics": {
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "sharpness": round(sharpness, 2),
        },
        "issues": {
            "blurry": is_blurry,
            "overexposed": is_overexposed,
            "underexposed": is_underexposed,
            "low_contrast": is_low_contrast,
        },
        "dimensions": {"width": img.width, "height": img.height},
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# Vegetation Index (Simplified NDVI-like)
# ============================================================

def compute_vegetation_index(
    image_path: Optional[str] = None,
    image_data: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Compute a simplified vegetation health index from RGB imagery.
    Uses the Excess Green Index (ExG) as a proxy for NDVI when
    only RGB bands are available.

    ExG = 2*G - R - B

    Args:
        image_path: Path to the image file
        image_data: Raw image bytes

    Returns:
        Dictionary with vegetation index results
    """
    if not HAS_PIL:
        return {"error": "PIL (Pillow) is not installed"}

    img = _load_image(image_path, image_data)
    if img is None:
        return {"error": "Failed to load image"}

    rgb = np.array(img, dtype=np.float64)
    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]

    exg = 2 * g - r - b
    exg_normalized = (exg + 255) / 510.0

    vegetation_mask = exg > 0
    vegetation_pct = float(np.sum(vegetation_mask)) / exg.size * 100

    mean_exg = float(np.mean(exg_normalized))
    std_exg = float(np.std(exg_normalized))

    if mean_exg > 0.3:
        health = "healthy"
    elif mean_exg > 0.15:
        health = "moderate"
    elif mean_exg > 0.05:
        health = "stressed"
    else:
        health = "bare"

    return {
        "vegetation_percentage": round(vegetation_pct, 2),
        "mean_index": round(mean_exg, 4),
        "index_std": round(std_exg, 4),
        "vegetation_health": health,
        "index_type": "ExG (Excess Green)",
        "note": "RGB-based proxy. For accurate NDVI, use Sentinel Hub with NIR band.",
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# Helpers
# ============================================================

def _load_image(
    image_path: Optional[str] = None,
    image_data: Optional[bytes] = None,
) -> Optional[Image.Image]:
    """Load an image from path or bytes."""
    if not HAS_PIL:
        return None

    try:
        if image_data:
            return Image.open(io.BytesIO(image_data)).convert("RGB")
        elif image_path and os.path.exists(image_path):
            return Image.open(image_path).convert("RGB")
    except Exception:
        pass

    return None
