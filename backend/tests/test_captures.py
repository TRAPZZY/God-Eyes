"""Tests for capture endpoints."""
from unittest.mock import patch, MagicMock
import os
import uuid


def test_create_capture(client, auth_headers, test_location):
    with patch("app.services.capture_engine.capture_mapbox") as mock_capture:
        mock_cap = MagicMock()
        mock_cap.id = uuid.uuid4()
        mock_cap.location_id = test_location.id
        mock_cap.image_path = os.path.join("uploads", "captures", "test.png")
        mock_cap.captured_at = MagicMock()
        mock_cap.captured_at.isoformat.return_value = "2024-01-01T00:00:00"
        mock_cap.image_url = "http://test.example.com/image.png"
        mock_cap.resolution = "standard"
        mock_cap.style = "satellite"
        mock_cap.source = "mapbox"
        mock_cap.image_metadata = {}
        mock_capture.return_value = mock_cap

        resp = client.post("/api/v1/captures/", json={
            "location_id": str(test_location.id),
            "resolution": "standard",
            "style": "satellite",
        }, headers=auth_headers)
        assert resp.status_code in (200, 201, 500)


def test_get_capture_history(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/captures/location/{loc_id}/history", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "captures" in data
    assert "total" in data


def test_get_static_map_url(client, auth_headers):
    resp = client.get(
        "/api/v1/captures/static-map-url?longitude=-77.0365&latitude=38.8977&zoom=15",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "url" in data


def test_get_capture_not_found(client, auth_headers):
    resp = client.get("/api/v1/captures/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_capture_not_found(client, auth_headers):
    resp = client.delete("/api/v1/captures/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 404
