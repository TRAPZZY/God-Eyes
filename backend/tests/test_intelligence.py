"""Tests for intelligence endpoints."""
import json
import io
from unittest.mock import patch, MagicMock


def test_weather_current(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/intelligence/weather/current/{loc_id}", headers=auth_headers)
    assert resp.status_code in (200, 503)


def test_weather_forecast(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/intelligence/weather/forecast/{loc_id}", headers=auth_headers)
    assert resp.status_code in (200, 503)


def test_batch_import(client, auth_headers):
    csv_content = "name,latitude,longitude,address\nTest Place,38.8899,-77.0091,Washington DC"
    resp = client.post(
        "/api/v1/intelligence/batch/import",
        files={"file": ("locations.csv", csv_content, "text/csv")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "success_count" in data or "imported" in data


def test_batch_template(client, auth_headers):
    resp = client.get("/api/v1/intelligence/batch/template", headers=auth_headers)
    assert resp.status_code == 200


def test_export_geojson(client, auth_headers):
    resp = client.get("/api/v1/intelligence/export/geojson", headers=auth_headers)
    assert resp.status_code == 200


def test_export_kml(client, auth_headers):
    resp = client.get("/api/v1/intelligence/export/kml", headers=auth_headers)
    assert resp.status_code == 200


def test_export_gpx(client, auth_headers):
    resp = client.get("/api/v1/intelligence/export/gpx", headers=auth_headers)
    assert resp.status_code == 200


def test_intelligence_summary(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/intelligence/summary/{loc_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "location_id" in data
    assert "capture_stats" in data


def test_heatmap_generation(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(
        f"/api/v1/intelligence/heatmap/{loc_id}?width=400&height=300",
        headers=auth_headers,
    )
    assert resp.status_code in (200, 400)
