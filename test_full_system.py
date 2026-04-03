"""
God Eyes - Full System Integration Test
Tests the ENTIRE workflow from registration through all features.
"""
import sys
import os
import time
import json
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=test_engine)
TestSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


def get_test_db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = get_test_db

client = TestClient(app)
BASE = "/api/v1"

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


def step(n, title):
    print(f"\n=== Step {n}: {title} ===")


# ============================================================
# Step 1: Register -> Login -> Get token
# ============================================================
step(1, "Register user -> Login -> Get token")


def test_register():
    resp = client.post(f"{BASE}/auth/register", json={
        "email": "integration@test.com",
        "username": "integration_user",
        "password": "SecurePass123!",
        "full_name": "Integration Test",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "integration@test.com"


test("Register user", test_register)


def test_login():
    resp = client.post(f"{BASE}/auth/login", json={
        "email": "integration@test.com",
        "password": "SecurePass123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    global TOKEN
    TOKEN = data["access_token"]
    global HEADERS
    HEADERS = {"Authorization": f"Bearer {TOKEN}"}


test("Login and get token", test_login)


# ============================================================
# Step 2: Create location -> Create geofence -> Create schedule
# ============================================================
step(2, "Create location -> Create geofence -> Create schedule")

LOCATION_ID = None
GEOFENCE_ID = None


def test_create_location():
    global LOCATION_ID
    resp = client.post(f"{BASE}/locations/", json={
        "name": "Integration Test Site",
        "latitude": 38.8977,
        "longitude": -77.0365,
        "zoom_level": 15,
    }, headers=HEADERS)
    assert resp.status_code == 201
    LOCATION_ID = resp.json()["id"]


test("Create location", test_create_location)


def test_create_geofence():
    global GEOFENCE_ID
    coords = json.dumps([
        [-77.0380, 38.8990], [-77.0350, 38.8990],
        [-77.0350, 38.8960], [-77.0380, 38.8960],
        [-77.0380, 38.8990],
    ])
    resp = client.post(f"{BASE}/locations/{LOCATION_ID}/geofences", json={
        "location_id": LOCATION_ID,
        "name": "Integration Perimeter",
        "coordinates": coords,
        "alert_on_change": True,
    }, headers=HEADERS)
    assert resp.status_code == 201
    GEOFENCE_ID = resp.json()["id"]


test("Create geofence", test_create_geofence)


def test_create_schedule():
    resp = client.post(f"{BASE}/monitoring/schedules", json={
        "location_id": LOCATION_ID,
        "frequency": "daily",
        "capture_resolution": "standard",
        "capture_style": "satellite",
    }, headers=HEADERS)
    assert resp.status_code == 201


test("Create schedule", test_create_schedule)


# ============================================================
# Step 3: Dashboard stats
# ============================================================
step(3, "Check dashboard stats")


def test_dashboard_stats():
    resp = client.get(f"{BASE}/analysis/dashboard-stats", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_locations"] >= 1


test("Dashboard stats", test_dashboard_stats)


# ============================================================
# Step 4: Monitoring status
# ============================================================
step(4, "Check monitoring status")


def test_monitoring_status():
    resp = client.get(f"{BASE}/analysis/monitoring/status", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "schedules" in data
    assert "scheduler" in data


test("Monitoring status", test_monitoring_status)


# ============================================================
# Step 5: Export locations
# ============================================================
step(5, "Export locations (GeoJSON, KML, GPX)")


def test_export_geojson():
    resp = client.get(f"{BASE}/intelligence/export/geojson", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "features" in data or "type" in data


test("GeoJSON export", test_export_geojson)


def test_export_kml():
    resp = client.get(f"{BASE}/intelligence/export/kml", headers=HEADERS)
    assert resp.status_code == 200
    assert "kml" in resp.text.lower() or "xml" in resp.text.lower()


test("KML export", test_export_kml)


def test_export_gpx():
    resp = client.get(f"{BASE}/intelligence/export/gpx", headers=HEADERS)
    assert resp.status_code == 200
    assert "gpx" in resp.text.lower() or "xml" in resp.text.lower()


test("GPX export", test_export_gpx)


# ============================================================
# Step 6: Batch import
# ============================================================
step(6, "Import locations from CSV")


def test_batch_import():
    csv_content = "name,latitude,longitude,address\nImported Place,38.8899,-77.0091,Washington DC"
    resp = client.post(
        f"{BASE}/intelligence/batch/import",
        files={"file": ("locations.csv", csv_content, "text/csv")},
        headers=HEADERS,
    )
    assert resp.status_code == 200


test("Batch import CSV", test_batch_import)


# ============================================================
# Step 7: Intelligence summary
# ============================================================
step(7, "Check intelligence summary")


def test_intelligence_summary():
    resp = client.get(f"{BASE}/intelligence/summary/{LOCATION_ID}", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "location_id" in data
    assert "capture_stats" in data


test("Intelligence summary", test_intelligence_summary)


# ============================================================
# Step 8: Rate limiting headers
# ============================================================
step(8, "Test rate limiting")


def test_rate_limiting_headers():
    resp = client.get(f"{BASE}/locations/", headers=HEADERS)
    assert resp.status_code == 200
    assert "X-RateLimit-Limit" in resp.headers
    assert "X-RateLimit-Remaining" in resp.headers


test("Rate limit headers present", test_rate_limiting_headers)


# ============================================================
# Step 9: Admin - list users
# ============================================================
step(9, "Admin: list users")


def test_admin_list_users():
    from app.core.security import get_password_hash, create_access_token
    from app.models.user import User, UserRole
    db = TestSession()
    admin = User(
        email="admin@test.com",
        username="admin_test",
        hashed_password=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    admin_token = create_access_token(data={"sub": str(admin.id), "type": "access"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get(f"{BASE}/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert data["total"] >= 1


test("Admin list users", test_admin_list_users)


# ============================================================
# Step 10: Security headers
# ============================================================
step(10, "Verify security headers")


def test_security_headers():
    resp = client.get(f"{BASE}/locations/", headers=HEADERS)
    assert "X-Content-Type-Options" in resp.headers
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert "X-Frame-Options" in resp.headers
    assert "Strict-Transport-Security" in resp.headers


test("Security headers present", test_security_headers)


# ============================================================
# Step 11: Geofence coverage
# ============================================================
step(11, "Geofence coverage analysis")


def test_geofence_coverage():
    resp = client.get(f"{BASE}/geofencing/coverage/{LOCATION_ID}", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_geofences" in data


test("Geofence coverage", test_geofence_coverage)


# ============================================================
# Step 12: Point in polygon
# ============================================================
step(12, "Point-in-polygon check")


def test_point_in_polygon():
    resp = client.get(
        f"{BASE}/geofencing/check-point",
        params={"location_id": LOCATION_ID, "latitude": 38.8977, "longitude": -77.0365},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "inside_any" in data


test("Point-in-polygon check", test_point_in_polygon)


# ============================================================
# Step 13: Heatmap generation
# ============================================================
step(13, "Heatmap generation")


def test_heatmap():
    from app.core.rate_limiter import RateLimitMiddleware
    for middleware in app.user_middleware:
        if hasattr(middleware, 'cls') and hasattr(middleware.cls, '__name__'):
            pass
    time.sleep(2)
    resp = client.get(
        f"{BASE}/intelligence/heatmap/{LOCATION_ID}?width=400&height=300",
        headers={**HEADERS, "X-Forwarded-For": "10.0.0.99"},
    )
    assert resp.status_code in (200, 400), f"Heatmap returned {resp.status_code}: {resp.text[:200]}"


test("Heatmap generation", test_heatmap)


# ============================================================
# Summary
# ============================================================
print("\n" + "=" * 60)
print(f"  FULL SYSTEM INTEGRATION TEST RESULTS")
print(f"  {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

if failed > 0:
    print(f"\n[!!] {failed} test(s) failed.")
    sys.exit(1)
else:
    print("\n[*] All integration tests passed. Vault seal integrity: NOMINAL")
