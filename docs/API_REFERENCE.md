# God Eyes - API Reference

Complete API documentation for the God Eyes Satellite Intelligence Platform.

Base URL: `http://localhost:8000/api/v1`

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a Bearer token in the `Authorization` header.

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "operator1",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "operator1",
  "full_name": "John Doe",
  "role": "operator",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00+00:00"
}
```

### POST /auth/login
Authenticate and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

### POST /auth/change-password
Change the current user's password.

**Request:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass456!"
}
```

## Locations

### GET /locations/
List all locations for the authenticated user.

**Query Parameters:**
- `skip` (int, default: 0) - Pagination offset
- `limit` (int, default: 50) - Max results
- `monitored_only` (bool, default: false) - Filter monitored locations

### POST /locations/
Create a new monitored location.

**Request:**
```json
{
  "name": "White House",
  "latitude": 38.8977,
  "longitude": -77.0365,
  "zoom_level": 15,
  "tags": "government,important",
  "notes": "Primary monitoring target"
}
```

### GET /locations/{id}
Get details for a specific location.

### PUT /locations/{id}
Update a location.

### DELETE /locations/{id}
Delete a location (204 No Content).

### GET /locations/search/autocomplete
Search for location suggestions.

**Query Parameters:**
- `q` (string, required) - Search query (min 2 chars)
- `limit` (int, default: 5) - Max suggestions

### GET /locations/geocode
Geocode an address to coordinates.

**Query Parameters:**
- `address` (string, required) - Address to geocode

### GET /locations/{id}/reverse-geocode
Get the address for a location's coordinates.

### POST /locations/{id}/geofences
Create a geofence perimeter for a location.

**Request:**
```json
{
  "location_id": "uuid",
  "name": "Perimeter Alpha",
  "coordinates": "[[-77.038,38.899],[-77.035,38.899],[-77.035,38.896],[-77.038,38.896],[-77.038,38.899]]",
  "alert_on_change": true
}
```

### POST /locations/{id}/annotations
Add a map annotation.

## Captures

### POST /captures/
Trigger a satellite image capture.

**Request:**
```json
{
  "location_id": "uuid",
  "resolution": "high",
  "style": "satellite"
}
```

### GET /captures/{id}
Get capture details.

### GET /captures/{id}/download
Download the capture image file.

### GET /captures/location/{id}/history
Get paginated capture history for a location.

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 20)

### GET /captures/location/{id}/changes
Get change detections for a location.

**Query Parameters:**
- `severity` (string, optional) - Filter by severity (high/medium/low)

### GET /captures/static-map-url
Get a static map URL without creating a capture.

### DELETE /captures/{id}
Delete a capture (204 No Content).

## Monitoring

### GET /monitoring/schedules
List monitoring schedules.

**Query Parameters:**
- `active_only` (bool, default: false)

### POST /monitoring/schedules
Create a monitoring schedule.

**Request:**
```json
{
  "location_id": "uuid",
  "frequency": "daily",
  "capture_resolution": "standard",
  "capture_style": "satellite"
}
```

Frequency options: `hourly`, `daily`, `weekly`, `monthly`

### PUT /monitoring/schedules/{id}
Update a schedule.

### DELETE /monitoring/schedules/{id}
Delete a schedule (204 No Content).

### POST /monitoring/schedules/{id}/trigger
Manually trigger a capture for a schedule.

### GET /monitoring/alerts
List alert rules.

### POST /monitoring/alerts
Create an alert rule.

**Request:**
```json
{
  "location_id": "uuid",
  "rule_type": "change_detected",
  "name": "High Severity Alert",
  "conditions": "{\"severity\": \"high\"}",
  "threshold": 50.0,
  "notification_channel": "email",
  "notification_target": "admin@example.com"
}
```

### PUT /monitoring/alerts/{id}
Update an alert rule.

### DELETE /monitoring/alerts/{id}
Delete an alert rule (204 No Content).

## Analysis

### POST /analysis/compare
Compare two captures for changes.

**Query Parameters:**
- `before_capture_id` (uuid, required)
- `after_capture_id` (uuid, required)

### GET /analysis/summary/{location_id}
Get change detection summary for a location.

### GET /analysis/sentinel-dates/{location_id}
Get available Sentinel-2 imagery dates.

### POST /analysis/sentinel-capture/{location_id}
Trigger a Sentinel-2 satellite capture.

### GET /analysis/ndvi/{location_id}
Get NDVI vegetation analysis image.

### GET /analysis/diff/{change_id}
Get change detection diff image.

### GET /analysis/dashboard-stats
Get dashboard statistics for the current user.

**Response:**
```json
{
  "total_locations": 5,
  "monitored_locations": 3,
  "total_captures": 42,
  "total_changes": 7,
  "high_severity_changes": 2
}
```

### GET /analysis/monitoring/status
Get monitoring system status.

## Geofencing

### GET /geofencing/coverage/{location_id}
Analyze geofence coverage for a location.

### GET /geofencing/check-point
Check if a point falls within any active geofence.

**Query Parameters:**
- `location_id` (uuid, required)
- `latitude` (float, required)
- `longitude` (float, required)

### POST /geofencing/circular-geofence
Create a circular geofence.

**Query Parameters:**
- `location_id` (uuid, required)
- `latitude` (float, required)
- `longitude` (float, required)
- `radius_km` (float, required)
- `name` (string, required)
- `num_points` (int, default: 32)
- `alert_on_change` (bool, default: true)

### GET /geofencing/{id}/analysis
Get detailed geofence analysis (area, perimeter).

### GET /geofencing/{id}
Get a specific geofence.

### PUT /geofencing/{id}
Update a geofence.

### DELETE /geofencing/{id}
Delete a geofence (204 No Content).

### GET /geofencing/distance/{location_id}
Calculate Haversine distance between two points.

## Intelligence

### GET /intelligence/summary/{location_id}
Get comprehensive intelligence summary for a location.

### GET /intelligence/weather/current/{location_id}
Get current weather conditions.

### GET /intelligence/weather/forecast/{location_id}
Get multi-day weather forecast.

### POST /intelligence/batch/import
Bulk import locations from CSV.

### GET /intelligence/batch/template
Download CSV import template.

### GET /intelligence/export/geojson
Export locations as GeoJSON.

### GET /intelligence/export/kml
Export locations as KML.

### GET /intelligence/export/gpx
Export locations as GPX.

### POST /intelligence/ai/land-use
Analyze land use classification.

### POST /intelligence/ai/object-detection
Perform object detection.

### POST /intelligence/ai/image-quality
Analyze image quality.

### POST /intelligence/ai/vegetation-index
Compute vegetation health index.

### POST /intelligence/timelapse/generate
Generate animated time-lapse.

### GET /intelligence/report/{location_id}
Generate intelligence report.

### GET /intelligence/heatmap/{location_id}
Generate change heatmap.

## Admin

### GET /admin/users
List all users (admin only).

### PUT /admin/users/{id}
Update user role or activation status (admin only).

### DELETE /admin/users/{id}
Delete a user (admin only).

### GET /admin/stats
Get system-wide statistics (admin only).

### GET /admin/health
Get detailed health check (admin only).

### GET /admin/logs
Get recent application logs (admin only).
