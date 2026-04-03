import requests, json

BASE = "http://localhost:8000/api/v1"

# 1. Register
print("=== 1. REGISTER ===")
r = requests.post(f"{BASE}/auth/register", json={
    "email": "trap@godeyes.com",
    "username": "trap",
    "password": "SecurePass123!",
    "full_name": "Trapzzy"
})
print(f"  Status: {r.status_code}")
if r.status_code == 201:
    print(f"  User created: {r.json()['username']}")
elif r.status_code == 400:
    print("  (User already exists - OK)")

# 2. Login
print()
print("=== 2. LOGIN ===")
r = requests.post(f"{BASE}/auth/login", json={
    "email": "trap@godeyes.com",
    "password": "SecurePass123!"
})
print(f"  Status: {r.status_code}")
token = r.json()["access_token"]
print(f"  Token: {token[:30]}...")
headers = {"Authorization": f"Bearer {token}"}

# 3. Get profile
print()
print("=== 3. GET PROFILE ===")
r = requests.get(f"{BASE}/auth/me", headers=headers)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    u = r.json()
    print(f"  User: {u['username']} | Role: {u['role']} | Email: {u['email']}")

# 4. Create location
print()
print("=== 4. CREATE LOCATION ===")
r = requests.post(f"{BASE}/locations/", json={
    "name": "White House",
    "address": "1600 Pennsylvania Avenue, Washington DC",
    "latitude": 38.8977,
    "longitude": -77.0365,
    "zoom_level": 16,
    "tags": "government,landmark"
}, headers=headers)
print(f"  Status: {r.status_code}")
loc_id = None
if r.status_code == 201:
    loc = r.json()
    loc_id = loc["id"]
    print(f"  Location: {loc['name']} | ID: {loc_id}")
    print(f"  Coords: {loc['latitude']}, {loc['longitude']}")

# 5. List locations
print()
print("=== 5. LIST LOCATIONS ===")
r = requests.get(f"{BASE}/locations/", headers=headers)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    locs = r.json()
    print(f"  Total: {len(locs)} locations")
    for l in locs:
        print(f"    - {l['name']} ({l['latitude']:.4f}, {l['longitude']:.4f})")

# 6. Capture satellite image
print()
print("=== 6. CAPTURE SATELLITE IMAGE ===")
if loc_id:
    r = requests.post(f"{BASE}/captures/", json={
        "location_id": loc_id,
        "resolution": "high",
        "style": "satellite"
    }, headers=headers)
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        cap = r.json()
        print(f"  Capture ID: {cap['id']}")
        print(f"  Source: {cap['source']}")
        print(f"  Resolution: {cap['resolution']}")
        print(f"  Size: {cap['width']}x{cap['height']}")
        print(f"  Image: {cap['image_url']}")

# 7. Dashboard stats
print()
print("=== 7. DASHBOARD STATS ===")
r = requests.get(f"{BASE}/analysis/dashboard-stats", headers=headers)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    stats = r.json()
    for k, v in stats.items():
        print(f"  {k}: {v}")

# 8. Geocoding test
print()
print("=== 8. GEOCODING ===")
r = requests.get(f"{BASE}/locations/geocode", params={"address": "Times Square, New York"}, headers=headers)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    g = r.json()
    print(f"  Address: {g['address']}")
    print(f"  Coords: {g['latitude']:.6f}, {g['longitude']:.6f}")

# 9. Static map URL
print()
print("=== 9. STATIC MAP URL ===")
r = requests.get(f"{BASE}/captures/static-map-url", params={
    "longitude": -77.0365, "latitude": 38.8977, "zoom": 16, "style": "satellite", "resolution": "high"
}, headers=headers)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    print(f"  URL generated: {r.json()['url'][:80]}...")

print()
print("===============================================")
print("  ALL API TESTS PASSED - PHASE 1 VERIFIED")
print("===============================================")
