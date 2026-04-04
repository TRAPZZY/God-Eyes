"""Tests for geofencing service functions."""
import json
from app.services.geofencing import (
    point_in_polygon,
    polygon_area,
    polygon_perimeter,
    haversine_distance,
    create_circular_geofence,
    parse_polygon_coordinates,
)


def test_point_in_polygon_inside():
    polygon = [
        [38.8990, -77.0380], [38.8990, -77.0350],
        [38.8960, -77.0350], [38.8960, -77.0380],
        [38.8990, -77.0380],
    ]
    assert point_in_polygon(38.8977, -77.0365, polygon) is True


def test_point_in_polygon_outside():
    polygon = [
        [38.8990, -77.0380], [38.8990, -77.0350],
        [38.8960, -77.0350], [38.8960, -77.0380],
        [38.8990, -77.0380],
    ]
    assert point_in_polygon(40.0, -75.0, polygon) is False


def test_polygon_area():
    polygon = [
        [38.8990, -77.0380], [38.8990, -77.0350],
        [38.8960, -77.0350], [38.8960, -77.0380],
        [38.8990, -77.0380],
    ]
    area = polygon_area(polygon)
    assert area > 0


def test_polygon_perimeter():
    polygon = [
        [38.8990, -77.0380], [38.8990, -77.0350],
        [38.8960, -77.0350], [38.8960, -77.0380],
        [38.8990, -77.0380],
    ]
    perimeter = polygon_perimeter(polygon)
    assert perimeter > 0


def test_haversine_distance():
    dist = haversine_distance(38.8977, -77.0365, 38.8899, -77.0091)
    assert dist > 0


def test_create_circular_geofence():
    polygon = create_circular_geofence(38.8977, -77.0365, radius_km=1.0, num_points=32)
    assert len(polygon) >= 32


def test_parse_polygon_coordinates():
    coords = json.dumps([
        [-77.0380, 38.8990], [-77.0350, 38.8990],
        [-77.0350, 38.8960], [-77.0380, 38.8960],
        [-77.0380, 38.8990],
    ])
    result = parse_polygon_coordinates(coords)
    assert len(result) == 5


def test_parse_polygon_coordinates_invalid():
    result = parse_polygon_coordinates("not json")
    assert result == []


def test_geofence_coverage_endpoint(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(f"/api/v1/geofencing/coverage/{loc_id}", headers=auth_headers)
    assert resp.status_code == 200


def test_check_point_in_geofences(client, auth_headers, test_location, test_geofence):
    loc_id = str(test_location.id)
    resp = client.get(
        f"/api/v1/geofencing/check-point",
        params={"location_id": loc_id, "latitude": 38.8977, "longitude": -77.0365},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "inside_any" in data


def test_geofence_analysis(client, auth_headers, test_geofence):
    gf_id = str(test_geofence.id)
    resp = client.get(f"/api/v1/geofencing/{gf_id}/analysis", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "area_km2" in data
    assert "perimeter_km" in data


def test_distance_calculation(client, auth_headers, test_location):
    loc_id = str(test_location.id)
    resp = client.get(
        f"/api/v1/geofencing/distance/{loc_id}",
        params={"lat1": 38.8977, "lon1": -77.0365, "lat2": 38.8899, "lon2": -77.0091},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "distance_km" in data
