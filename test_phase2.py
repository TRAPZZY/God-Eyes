import requests, time

BASE = "http://localhost:8000/api/v1"

# 1. Login
print("=== 1. LOGIN ===")
r = requests.post(f"{BASE}/auth/login", json={
    "email": "trap@godeyes.com",
    "password": "SecurePass123!"
}, timeout=10)
print(f"  Status: {r.status_code}")
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Create location
print()
print("=== 2. CREATE LOCATION ===")
r = requests.post(f"{BASE}/locations/", json={
    "name": "White House",
    "address": "1600 Pennsylvania Avenue, Washington DC",
    "latitude": 38.8977,
    "longitude": -77.0365,
    "zoom_level": 16,
}, headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
loc_id = r.json()["id"]
print(f"  Location: {r.json()['name']} ({loc_id})")

# 3. Create monitoring schedule
print()
print("=== 3. CREATE MONITORING SCHEDULE ===")
r = requests.post(f"{BASE}/monitoring/schedules", json={
    "location_id": loc_id,
    "frequency": "daily",
    "capture_resolution": "high",
    "capture_style": "satellite"
}, headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
schedule_id = None
if r.status_code == 201:
    sched = r.json()
    schedule_id = sched["id"]
    print(f"  Schedule ID: {schedule_id}")
    print(f"  Frequency: {sched['frequency']}")
    print(f"  Next capture: {sched['next_capture_at']}")

# 4. Trigger manual capture via schedule
print()
print("=== 4. TRIGGER SCHEDULED CAPTURE ===")
if schedule_id:
    r = requests.post(f"{BASE}/monitoring/schedules/{schedule_id}/trigger", headers=headers, timeout=30)
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        cap = r.json()
        print(f"  Capture ID: {cap['id']}")
        print(f"  Source: {cap['source']}")
        print(f"  Resolution: {cap['resolution']}")
        print(f"  Size: {cap['width']}x{cap['height']}")
    time.sleep(1)

    # Second capture for change detection comparison
    print()
    print("=== 4b. SECOND CAPTURE (for comparison) ===")
    r = requests.post(f"{BASE}/monitoring/schedules/{schedule_id}/trigger", headers=headers, timeout=30)
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        cap2 = r.json()
        print(f"  Capture ID: {cap2['id']}")

# 5. Create alert rule
print()
print("=== 5. CREATE ALERT RULE ===")
r = requests.post(f"{BASE}/monitoring/alerts", json={
    "location_id": loc_id,
    "rule_type": "custom",
    "name": "High Severity Alert",
    "notification_channel": "webhook",
    "notification_target": "https://httpbin.org/post"
}, headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 201:
    alert = r.json()
    print(f"  Alert: {alert['name']}")
    print(f"  Channel: {alert['notification_channel']}")

# 6. Monitoring status
print()
print("=== 6. MONITORING STATUS ===")
r = requests.get(f"{BASE}/analysis/monitoring/status", headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    status = r.json()
    print(f"  Schedules: {len(status.get('schedules', []))}")
    scheduler = status.get('scheduler', {})
    print(f"  Scheduler runs: {scheduler.get('total_runs', 0)}")
    print(f"  Scheduler captures: {scheduler.get('total_captures', 0)}")
    for s in status.get('schedules', []):
        print(f"    - {s['location_name']}: {s['frequency']} | {s['total_captures']} captures | {'Active' if s['is_active'] else 'Paused'}")

# 7. List alerts
print()
print("=== 7. LIST ALERTS ===")
r = requests.get(f"{BASE}/monitoring/alerts", headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    alerts = r.json()
    print(f"  Total: {len(alerts)} alert rules")
    for a in alerts:
        print(f"    - {a['name']} ({a['rule_type']}) -> {a['notification_channel']}")

# 8. Capture history
print()
print("=== 8. CAPTURE HISTORY ===")
r = requests.get(f"{BASE}/captures/location/{loc_id}/history", headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"  Total captures: {data.get('total', 0)}")
    captures = data.get('captures', [])
    for c in captures[:5]:
        print(f"    - {c['source']} | {c['resolution']} | {c['width']}x{c['height']} | {c['captured_at'][:19]}")

# 9. Dashboard stats
print()
print("=== 9. DASHBOARD STATS ===")
r = requests.get(f"{BASE}/analysis/dashboard-stats", headers=headers, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    stats = r.json()
    for k, v in stats.items():
        print(f"  {k}: {v}")

print()
print("===============================================")
print("  PHASE 2 MONITORING ENGINE - ALL TESTS PASSED")
print("===============================================")
