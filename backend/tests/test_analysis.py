"""Tests for analysis endpoints."""
from unittest.mock import patch, MagicMock


def test_dashboard_stats(client, auth_headers):
    resp = client.get("/api/v1/analysis/dashboard-stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_locations" in data
    assert "total_captures" in data
    assert "total_changes" in data


def test_monitoring_status(client, auth_headers):
    resp = client.get("/api/v1/analysis/monitoring/status", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "schedules" in data
    assert "scheduler" in data


def test_change_summary(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/analysis/summary/{loc_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_changes" in data


def test_sentinel_dates(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/analysis/sentinel-dates/{loc_id}", headers=auth_headers)
    assert resp.status_code in (200, 503)


def test_compare_captures_not_found(client, auth_headers):
    resp = client.post(
        "/api/v1/analysis/compare",
        params={
            "before_capture_id": "00000000-0000-0000-0000-000000000001",
            "after_capture_id": "00000000-0000-0000-0000-000000000002",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404
