"""Tests for location management endpoints."""
import json


def test_create_location(client, auth_headers):
    resp = client.post("/api/v1/locations/", json={
        "name": "White House",
        "latitude": 38.8977,
        "longitude": -77.0365,
        "zoom_level": 15,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "White House"
    assert data["latitude"] == 38.8977


def test_list_locations(client, auth_headers, test_location):
    resp = client.get("/api/v1/locations/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_location(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/locations/{loc_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == loc_id


def test_update_location(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.put(f"/api/v1/locations/{loc_id}", json={
        "name": "Updated Location",
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Location"


def test_delete_location(client, auth_headers, db_session, test_user):
    from app.models.location import Location
    from uuid import uuid4
    loc = Location(
        user_id=test_user.id,
        name="To Delete",
        latitude=40.0,
        longitude=-74.0,
        zoom_level=12,
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)

    resp = client.delete(f"/api/v1/locations/{loc.id}", headers=auth_headers)
    assert resp.status_code == 204


def test_get_location_not_found(client, auth_headers):
    resp = client.get("/api/v1/locations/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 404


def test_create_geofence(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    coords = json.dumps([
        [-77.0380, 38.8990], [-77.0350, 38.8990],
        [-77.0350, 38.8960], [-77.0380, 38.8960],
        [-77.0380, 38.8990],
    ])
    resp = client.post(f"/api/v1/locations/{loc_id}/geofences", json={
        "location_id": loc_id,
        "name": "Test Perimeter",
        "coordinates": coords,
        "alert_on_change": True,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Perimeter"


def test_create_annotation(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.post(f"/api/v1/locations/{loc_id}/annotations", json={
        "location_id": loc_id,
        "coordinates": json.dumps([-77.0365, 38.8977]),
        "note": "Test annotation",
        "annotation_type": "marker",
    }, headers=auth_headers)
    assert resp.status_code == 201


def test_reverse_geocode(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/locations/{loc_id}/reverse-geocode", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "address" in data


def test_geofence_crud(client, auth_headers, test_geofence):
    gf_id = str(test_geofence.id)
    resp = client.get(f"/api/v1/geofencing/{gf_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.put(f"/api/v1/geofencing/{gf_id}?name=Updated+Geofence", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Geofence"

    resp = client.delete(f"/api/v1/geofencing/{gf_id}", headers=auth_headers)
    assert resp.status_code == 204
