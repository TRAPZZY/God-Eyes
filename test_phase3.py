import requests, json, io

BASE = "http://localhost:8000/api/v1"

def login():
    r = requests.post(f"{BASE}/auth/login", json={
        "email": "trap@godeyes.com",
        "password": "SecurePass123!"
    }, timeout=10)
    return r.json()["access_token"]

def get_location(headers):
    locs = requests.get(f"{BASE}/locations/", headers=headers, timeout=10).json()
    if not locs:
        r = requests.post(f"{BASE}/locations/", json={
            "name": "White House", "latitude": 38.8977, "longitude": -77.0365, "zoom_level": 15
        }, headers=headers, timeout=10)
        locs = [r.json()]
    return locs[0]

def test_geofencing(token):
    print("=== 1. GEOFENCING ===")
    headers = {"Authorization": f"Bearer {token}"}
    loc = get_location(headers)
    loc_id = loc["id"]

    r = requests.post(f"{BASE}/locations/{loc_id}/geofences", json={
        "location_id": loc_id,
        "name": "Test Perimeter",
        "coordinates": json.dumps([
            [-77.0380, 38.8990], [-77.0350, 38.8990],
            [-77.0350, 38.8960], [-77.0380, 38.8960],
            [-77.0380, 38.8990]
        ]),
        "alert_on_change": True
    }, headers=headers, timeout=10)
    print(f"  Create geofence: {r.status_code}")
    geofence_id = None
    if r.status_code == 201:
        gf = r.json()
        geofence_id = gf["id"]
        print(f"  Name: {gf['name']}")

    r = requests.get(f"{BASE}/geofencing/coverage/{loc_id}", headers=headers, timeout=10)
    print(f"  Coverage analysis: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Geofences: {data.get('total_geofences', 0)}")

    r = requests.get(
        f"{BASE}/geofencing/check-point",
        params={
            "location_id": loc_id,
            "latitude": 38.8977,
            "longitude": -77.0365,
        },
        headers=headers,
        timeout=10,
    )
    print(f"  Point-in-polygon: {r.status_code}")
    if r.status_code == 200:
        print(f"  Inside: {r.json().get('inside_any', False)}")
    elif r.status_code == 422:
        print(f"  (Validation issue - checking schema)")

    r = requests.get(f"{BASE}/geofencing/{geofence_id}/analysis", headers=headers, timeout=10) if geofence_id else None
    print(f"  Geofence analysis: {r.status_code if r else 'skip'}")
    if r and r.status_code == 200:
        data = r.json()
        print(f"  Area: {data.get('area_km2', 0):.4f} km2")
        print(f"  Perimeter: {data.get('perimeter_km', 0):.2f} km")


def test_weather(token):
    print()
    print("=== 2. WEATHER ===")
    headers = {"Authorization": f"Bearer {token}"}
    loc = get_location(headers)
    loc_id = loc["id"]

    r = requests.get(f"{BASE}/intelligence/weather/current/{loc_id}", headers=headers, timeout=10)
    print(f"  Current weather: {r.status_code}")
    if r.status_code == 503:
        print(f"  (OpenWeatherMap API key not configured - expected)")
    elif r.status_code == 200:
        data = r.json()
        print(f"  Temp: {data.get('temperature', 'N/A')}")

    r = requests.get(f"{BASE}/intelligence/weather/forecast/{loc_id}", headers=headers, timeout=10)
    print(f"  Forecast: {r.status_code}")


def test_ai_analysis(token):
    print()
    print("=== 3. AI ANALYSIS ===")
    headers = {"Authorization": f"Bearer {token}"}
    loc = get_location(headers)
    loc_id = loc["id"]
    caps = requests.get(f"{BASE}/captures/location/{loc_id}/history", headers=headers, timeout=10).json()
    captures = caps.get("captures", [])
    if not captures:
        r = requests.post(f"{BASE}/captures/", json={"location_id": loc_id, "resolution": "high", "style": "satellite"}, headers=headers, timeout=30)
        if r.status_code == 200:
            captures = [r.json()]
    if not captures:
        print("  SKIP: No captures")
        return
    cap_id = captures[0]["id"]

    r = requests.post(f"{BASE}/intelligence/ai/land-use", params={"capture_id": cap_id}, headers=headers, timeout=15)
    print(f"  Land use: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Primary: {data.get('primary_class', 'N/A')}")
        print(f"  Classes: {json.dumps(data.get('class_percentages', {}))}")

    r = requests.post(f"{BASE}/intelligence/ai/image-quality", params={"capture_id": cap_id}, headers=headers, timeout=15)
    print(f"  Image quality: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Overall: {data.get('overall_quality', 'N/A')}")
        print(f"  Blur: {data.get('blur_score', 0):.2f}")

    r = requests.post(f"{BASE}/intelligence/ai/object-detection", params={"capture_id": cap_id}, headers=headers, timeout=60)
    print(f"  Object detection: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Objects: {data.get('object_count', 0)}")

    r = requests.post(f"{BASE}/intelligence/ai/vegetation-index", params={"capture_id": cap_id}, headers=headers, timeout=15)
    print(f"  Vegetation index: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  ExG: {data.get('exg_index', 0):.4f}")


def test_batch_import(token):
    print()
    print("=== 4. BATCH IMPORT ===")
    headers = {"Authorization": f"Bearer {token}"}
    csv_content = "name,latitude,longitude,address\nCapitol Building,38.8899,-77.0091,Washington DC\nLincoln Memorial,38.8893,-77.0502,Washington DC"
    files = {"file": ("locations.csv", csv_content, "text/csv")}
    r = requests.post(f"{BASE}/intelligence/batch/import", files=files, headers=headers, timeout=15)
    print(f"  Batch import: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Success: {data.get('imported', data.get('success_count', 0))}")
        print(f"  Failed: {data.get('failed', data.get('failed_count', 0))}")

    r = requests.get(f"{BASE}/intelligence/batch/template", headers=headers, timeout=10)
    print(f"  CSV template: {r.status_code}")


def test_export(token):
    print()
    print("=== 5. EXPORT/IMPORT ===")
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE}/intelligence/export/geojson", headers=headers, timeout=10)
    print(f"  GeoJSON export: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        features = data.get("features", [])
        print(f"  Features: {len(features)}")

    r = requests.get(f"{BASE}/intelligence/export/kml", headers=headers, timeout=10)
    print(f"  KML export: {r.status_code}")
    if r.status_code == 200:
        print(f"  KML size: {len(r.text)} chars")

    r = requests.get(f"{BASE}/intelligence/export/gpx", headers=headers, timeout=10)
    print(f"  GPX export: {r.status_code}")
    if r.status_code == 200:
        print(f"  GPX size: {len(r.text)} chars")


def test_intelligence_summary(token):
    print()
    print("=== 6. INTELLIGENCE SUMMARY ===")
    headers = {"Authorization": f"Bearer {token}"}
    loc = get_location(headers)
    loc_id = loc["id"]

    r = requests.get(f"{BASE}/intelligence/summary/{loc_id}", headers=headers, timeout=10)
    print(f"  Summary: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        for k, v in data.items():
            if isinstance(v, dict):
                print(f"  {k}: {json.dumps(v)}")
            else:
                print(f"  {k}: {v}")


if __name__ == "__main__":
    print("=" * 60)
    print("  GOD EYES - PHASE 3 INTELLIGENCE FEATURES TEST")
    print("=" * 60)
    print()

    try:
        token = login()
        print("[OK] Authenticated")
        print()

        test_geofencing(token)
        test_weather(token)
        test_ai_analysis(token)
        test_batch_import(token)
        test_export(token)
        test_intelligence_summary(token)

        print()
        print("=" * 60)
        print("  PHASE 3 INTELLIGENCE FEATURES - COMPLETE")
        print("=" * 60)
    except Exception as e:
        print(f"[FAIL] {e}")
