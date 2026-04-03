"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Phase 4 Advanced Features Test Suite

Creator: Trapzzy
Contact: traphubs@outlook.com

Tests all Phase 4 features:
1. Time-lapse Generator
2. Report Generation
3. API Rate Limiting Middleware
4. LRU Cache with TTL
5. Heatmap Generation
6. Frontend API service additions
"""

import sys
import os
import time
import uuid
import json
import tempfile
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

print("=" * 60)
print("  GOD EYES - PHASE 4 ADVANCED FEATURES TEST")
print("=" * 60)
print()

passed = 0
failed = 0


def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  [OK] {name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        failed += 1


# ============================================================
# 1. LRU Cache Tests
# ============================================================
print("=== 1. LRU CACHE ===")

from app.core.cache import LRUCache, CacheEntry, get_cache


def test_cache_basic():
    cache = LRUCache(max_size=3, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    assert cache.get("a") == 1
    assert cache.get("b") == 2
    assert cache.get("c") == 3


test("Basic set/get", test_cache_basic)


def test_cache_lru_eviction():
    cache = LRUCache(max_size=3, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    cache.get("a")
    cache.set("d", 4)
    assert cache.get("b") is None
    assert cache.get("a") == 1
    assert cache.get("d") == 4


test("LRU eviction", test_cache_lru_eviction)


def test_cache_ttl_expiration():
    cache = LRUCache(max_size=10, default_ttl=1)
    cache.set("x", "value")
    assert cache.get("x") == "value"
    time.sleep(1.1)
    assert cache.get("x") is None


test("TTL expiration", test_cache_ttl_expiration)


def test_cache_delete():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("k", "v")
    assert cache.delete("k") is True
    assert cache.get("k") is None
    assert cache.delete("nonexistent") is False


test("Delete entry", test_cache_delete)


def test_cache_clear():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.clear()
    assert cache.size == 0


test("Clear cache", test_cache_clear)


def test_cache_cleanup_expired():
    cache = LRUCache(max_size=10, default_ttl=1)
    cache.set("a", 1)
    cache.set("b", 2)
    time.sleep(1.1)
    cache.set("c", 3)
    removed = cache.cleanup_expired()
    assert removed == 2
    assert cache.size == 1


test("Cleanup expired entries", test_cache_cleanup_expired)


def test_cache_stats():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("a", 1)
    cache.get("a")
    cache.get("missing")
    stats = cache.stats
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["size"] == 1
    assert stats["hit_rate_percent"] == 50.0


test("Cache statistics", test_cache_stats)


def test_cache_decorator():
    cache = LRUCache(max_size=10, default_ttl=60)
    call_count = [0]

    @cache.cached(ttl=60)
    def expensive_fn(x):
        call_count[0] += 1
        return x * 2

    assert expensive_fn(5) == 10
    assert expensive_fn(5) == 10
    assert call_count[0] == 1


test("Cache decorator", test_cache_decorator)


def test_global_cache():
    cache = get_cache()
    assert isinstance(cache, LRUCache)
    assert cache.max_size == 256


test("Global cache singleton", test_global_cache)


# ============================================================
# 2. Rate Limiter Tests
# ============================================================
print()
print("=== 2. RATE LIMITER ===")

from app.core.rate_limiter import RateLimiter, RateLimitMiddleware


def test_rate_limiter_basic():
    limiter = RateLimiter(default_limit=5, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "127.0.0.1"
    mock_req.headers = {}

    for i in range(5):
        allowed, _ = limiter.is_allowed(mock_req)
        assert allowed is True

    allowed, headers = limiter.is_allowed(mock_req)
    assert allowed is False
    assert "Retry-After" in headers


test("Basic rate limiting", test_rate_limiter_basic)


def test_rate_limiter_per_endpoint():
    limiter = RateLimiter(
        default_limit=60,
        window_seconds=60,
        endpoint_limits={"/api/timelapse": (2, 60)},
    )
    mock_req = MagicMock()
    mock_req.client.host = "10.0.0.1"
    mock_req.headers = {}

    mock_req.url.path = "/api/timelapse/generate"
    limiter.is_allowed(mock_req)
    limiter.is_allowed(mock_req)
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is False


test("Per-endpoint limits", test_rate_limiter_per_endpoint)


def test_rate_limiter_headers():
    limiter = RateLimiter(default_limit=10, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "192.168.1.1"
    mock_req.headers = {}

    allowed, headers = limiter.is_allowed(mock_req)
    assert allowed is True
    assert int(headers["X-RateLimit-Limit"]) == 10
    assert int(headers["X-RateLimit-Remaining"]) == 9
    assert "X-RateLimit-Reset" in headers


test("Rate limit headers", test_rate_limiter_headers)


def test_rate_limiter_forwarded_for():
    limiter = RateLimiter(default_limit=5, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "127.0.0.1"
    mock_req.headers = {"x-forwarded-for": "203.0.113.50, 70.41.3.18"}

    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is True


test("X-Forwarded-For header handling", test_rate_limiter_forwarded_for)


def test_rate_limiter_reset():
    limiter = RateLimiter(default_limit=2, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "10.0.0.5"
    mock_req.headers = {}

    limiter.is_allowed(mock_req)
    limiter.is_allowed(mock_req)
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is False

    limiter.reset("10.0.0.5")
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is True


test("Reset client limits", test_rate_limiter_reset)


def test_rate_limiter_different_ips():
    limiter = RateLimiter(default_limit=1, window_seconds=60)

    req1 = MagicMock()
    req1.url.path = "/api/test"
    req1.client.host = "1.1.1.1"
    req1.headers = {}

    req2 = MagicMock()
    req2.url.path = "/api/test"
    req2.client.host = "2.2.2.2"
    req2.headers = {}

    limiter.is_allowed(req1)
    allowed1, _ = limiter.is_allowed(req1)
    assert allowed1 is False

    allowed2, _ = limiter.is_allowed(req2)
    assert allowed2 is True


test("Separate limits per IP", test_rate_limiter_different_ips)


# ============================================================
# 3. Time-lapse Generator Tests
# ============================================================
print()
print("=== 3. TIME-LAPSE GENERATOR ===")

from app.services.timelapse import (
    generate_timelapse,
    _add_overlay,
    _normalize_frames,
    _get_font,
)


def test_timelapse_missing_location():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = generate_timelapse(mock_db, uuid.uuid4())
    assert result["status"] == "error"
    assert "not found" in result["message"].lower()


test("Missing location error", test_timelapse_missing_location)


def test_timelapse_insufficient_frames():
    mock_db = MagicMock()
    mock_location = MagicMock()
    mock_location.name = "Test Site"
    mock_db.query.return_value.filter.return_value.first.return_value = mock_location

    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

    result = generate_timelapse(mock_db, uuid.uuid4())
    assert result["status"] == "error"
    assert "at least 2 frames" in result["message"].lower()


test("Insufficient frames error", test_timelapse_insufficient_frames)


def test_font_loading():
    font = _get_font(size=14)
    assert font is not None


test("Font loading", test_font_loading)


def test_overlay_rendering():
    img = __import__("PIL.Image", fromlist=["Image"]).new("RGB", (640, 480), (30, 30, 30))
    result = _add_overlay(img, "2024-01-01 12:00 UTC", "Test Location")
    assert result.size == (640, 480)
    assert result.mode == "RGB"


test("Overlay rendering", test_overlay_rendering)


def test_frame_normalization():
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        img = __import__("PIL.Image", fromlist=["Image"]).new("RGB", (100, 100), (255, 0, 0))
        img.save(f.name)
        temp_path = f.name

    frames = _normalize_frames([temp_path], target_size=(200, 150))
    assert len(frames) == 1
    assert frames[0].size == (200, 150)

    os.unlink(temp_path)


test("Frame normalization", test_frame_normalization)


# ============================================================
# 4. Report Generation Tests
# ============================================================
print()
print("=== 4. REPORT GENERATION ===")

from app.services.reports import (
    generate_report,
    _get_location_stats,
    _build_html_report,
)


def test_report_missing_location():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = generate_report(mock_db, uuid.uuid4())
    assert result["status"] == "error"


test("Missing location error", test_report_missing_location)


def test_report_html_generation():
    mock_db = MagicMock()
    mock_location = MagicMock()
    mock_location.name = "Test Site"
    mock_location.latitude = 38.8977
    mock_location.longitude = -77.0365
    mock_db.query.return_value.filter.return_value.first.return_value = mock_location

    mock_db.query.return_value.filter.return_value.count.return_value = 0
    mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = []
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
    mock_db.query.return_value.filter.return_value.all.return_value = []

    result = generate_report(mock_db, uuid.uuid4(), fmt="html")
    assert result["status"] == "success"
    assert result["format"] == "html"
    assert result["file_path"].endswith(".html")
    assert os.path.isfile(result["file_path"])

    with open(result["file_path"], "r", encoding="utf-8") as f:
        content = f.read()
    assert "God Eyes" in content
    assert "Test Site" in content

    os.unlink(result["file_path"])


test("HTML report generation", test_report_html_generation)


def test_report_html_content():
    mock_location = MagicMock()
    mock_location.name = "Area 51"
    mock_location.latitude = 37.2350
    mock_location.longitude = -115.8111

    stats = {
        "total_captures": 42,
        "total_changes": 7,
        "source_breakdown": {"mapbox": 30, "sentinel": 12},
        "resolution_breakdown": {"high": 20, "standard": 22},
        "severity_breakdown": {"high": 2, "medium": 3, "low": 2},
        "avg_change_score": 34.5,
        "first_capture": "2024-01-01T00:00:00+00:00",
        "last_capture": "2024-06-01T00:00:00+00:00",
    }

    html = _build_html_report(mock_location, stats, [], [])
    assert "Area 51" in html
    assert "42" in html
    assert "34.5" in html


test("HTML report content", test_report_html_content)


# ============================================================
# 5. Heatmap Generation Tests
# ============================================================
print()
print("=== 5. HEATMAP GENERATION ===")

from app.services.heatmap import (
    generate_heatmap,
    _intensity_to_color,
    _generate_base_image,
    _draw_heatmap_overlay,
)


def test_heatmap_missing_location():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = generate_heatmap(mock_db, uuid.uuid4())
    assert result["status"] == "error"


test("Missing location error", test_heatmap_missing_location)


def test_intensity_color_mapping():
    blue = _intensity_to_color(0.0)
    assert blue[0] == 0 and blue[2] == 255

    red = _intensity_to_color(1.0)
    assert red[0] == 255 and red[2] == 0

    mid = _intensity_to_color(0.5)
    assert mid[1] == 255


test("Intensity to color mapping", test_intensity_color_mapping)


def test_base_image_generation():
    img = _generate_base_image(800, 600)
    assert img.size == (800, 600)
    assert img.mode == "RGB"


test("Base image generation", test_base_image_generation)


def test_heatmap_overlay_empty():
    base = _generate_base_image(400, 300)
    result = _draw_heatmap_overlay(base, [])
    assert result.size == (400, 300)
    assert result.mode == "RGBA"


test("Empty heatmap overlay", test_heatmap_overlay_empty)


def test_heatmap_overlay_with_points():
    base = _generate_base_image(400, 300)
    points = [
        {"change_id": "abc123", "intensity": 0.8},
        {"change_id": "def456", "intensity": 0.3},
    ]
    result = _draw_heatmap_overlay(base, points, radius=30)
    assert result.size == (400, 300)


test("Heatmap overlay with points", test_heatmap_overlay_with_points)


def test_heatmap_full_generation():
    mock_db = MagicMock()
    mock_location = MagicMock()
    mock_location.name = "Test Zone"
    mock_db.query.return_value.filter.return_value.first.return_value = mock_location
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

    result = generate_heatmap(mock_db, uuid.uuid4(), width=400, height=300)
    assert result["status"] == "success"
    assert result["file_path"].endswith(".png")
    assert os.path.isfile(result["file_path"])

    from PIL import Image
    img = Image.open(result["file_path"])
    assert img.size == (400, 300)
    img.close()

    os.unlink(result["file_path"])


test("Full heatmap generation", test_heatmap_full_generation)


# ============================================================
# 6. Integration Tests
# ============================================================
print()
print("=== 6. INTEGRATION ===")


def test_cache_with_mapbox_service():
    from app.core.cache import get_cache

    cache = get_cache()
    cache.clear()

    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.content = b"fake_image_data"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        from app.services.mapbox import fetch_static_map
        result = fetch_static_map(0.0, 0.0, zoom=10)
        assert result == b"fake_image_data"

        assert cache.size >= 1
        stats = cache.stats
        assert stats["hits"] == 0
        assert stats["misses"] == 1

        result2 = fetch_static_map(0.0, 0.0, zoom=10)
        assert result2 == b"fake_image_data"
        assert mock_get.call_count == 1


test("Mapbox cache integration", test_cache_with_mapbox_service)


def test_rate_limiter_middleware_import():
    from app.core.rate_limiter import RateLimitMiddleware
    from starlette.middleware.base import BaseHTTPMiddleware
    assert issubclass(RateLimitMiddleware, BaseHTTPMiddleware)


test("Rate limiter middleware inheritance", test_rate_limiter_middleware_import)


def test_main_app_includes_rate_limiter():
    with open(os.path.join(os.path.dirname(__file__), "backend", "app", "main.py"), "r") as f:
        content = f.read()
    assert "RateLimitMiddleware" in content
    assert "app.add_middleware" in content


test("Main app includes rate limiter", test_main_app_includes_rate_limiter)


def test_intelligence_api_has_new_routes():
    with open(os.path.join(os.path.dirname(__file__), "backend", "app", "api", "intelligence.py"), "r") as f:
        content = f.read()
    assert "generate_location_timelapse" in content
    assert "get_location_report" in content
    assert "get_location_heatmap" in content
    assert "timelapse/generate" in content
    assert "report/{location_id}" in content
    assert "heatmap/{location_id}" in content


test("Intelligence API has new routes", test_intelligence_api_has_new_routes)


def test_frontend_api_services():
    with open(os.path.join(os.path.dirname(__file__), "frontend", "src", "services", "api.ts"), "r") as f:
        content = f.read()
    assert "timelapseAPI" in content
    assert "reportAPI" in content
    assert "heatmapAPI" in content
    assert "/intelligence/timelapse/generate" in content
    assert "/intelligence/report/" in content
    assert "/intelligence/heatmap/" in content


test("Frontend API services updated", test_frontend_api_services)


def test_export_component():
    with open(os.path.join(os.path.dirname(__file__), "frontend", "src", "components", "Export", "Export.tsx"), "r") as f:
        content = f.read()
    assert "timelapseAPI" in content
    assert "reportAPI" in content
    assert "handleGenerateTimelapse" in content
    assert "handleGenerateReport" in content


test("Export component has timelapse and report UI", test_export_component)


def test_dashboard_has_widgets():
    with open(os.path.join(os.path.dirname(__file__), "frontend", "src", "components", "Dashboard", "Dashboard.tsx"), "r") as f:
        content = f.read()
    assert "WidgetConfig" in content
    assert "toggleWidget" in content
    assert "showWidgetSettings" in content
    assert "heatmapAPI" in content


test("Dashboard has customizable widgets", test_dashboard_has_widgets)


# ============================================================
# Summary
# ============================================================
print()
print("=" * 60)
print(f"  RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

if failed > 0:
    print(f"\n[!!] {failed} test(s) failed. Review output above.")
    sys.exit(1)
else:
    print("\n[*] All Phase 4 tests passed. Vault seal integrity: NOMINAL")
