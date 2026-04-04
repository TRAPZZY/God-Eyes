"""Tests for monitoring endpoints."""
from unittest.mock import patch, MagicMock
import os


def test_create_schedule(client, auth_headers, test_location):
    resp = client.post("/api/v1/monitoring/schedules", json={
        "location_id": str(test_location.id),
        "frequency": "daily",
        "capture_resolution": "standard",
        "capture_style": "satellite",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["location_id"] == str(test_location.id)


def test_list_schedules(client, auth_headers):
    resp = client.get("/api/v1/monitoring/schedules", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_schedules_active_only(client, auth_headers):
    resp = client.get("/api/v1/monitoring/schedules?active_only=true", headers=auth_headers)
    assert resp.status_code == 200


def test_update_schedule(client, auth_headers, test_location, db_session):
    from app.models.schedule import MonitoringSchedule
    from app.models.location import Location
    from datetime import datetime, timezone, timedelta
    loc = db_session.query(Location).first()
    if not loc:
        loc = test_location
    sched = MonitoringSchedule(
        location_id=loc.id,
        frequency="daily",
        capture_resolution="standard",
        capture_style="satellite",
        next_capture_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db_session.add(sched)
    db_session.commit()
    db_session.refresh(sched)

    resp = client.put(f"/api/v1/monitoring/schedules/{sched.id}", json={
        "is_active": False,
    }, headers=auth_headers)
    assert resp.status_code == 200


def test_delete_schedule(client, auth_headers, test_location, db_session):
    from app.models.schedule import MonitoringSchedule
    from app.models.location import Location
    from datetime import datetime, timezone, timedelta
    loc = db_session.query(Location).first()
    if not loc:
        loc = test_location
    sched = MonitoringSchedule(
        location_id=loc.id,
        frequency="daily",
        capture_resolution="standard",
        capture_style="satellite",
        next_capture_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db_session.add(sched)
    db_session.commit()
    db_session.refresh(sched)

    resp = client.delete(f"/api/v1/monitoring/schedules/{sched.id}", headers=auth_headers)
    assert resp.status_code == 204


def test_create_alert_rule(client, auth_headers, test_location):
    resp = client.post("/api/v1/monitoring/alerts", json={
        "location_id": str(test_location.id),
        "rule_type": "custom",
        "name": "Test Alert",
        "conditions": {"severity": "high"},
        "threshold": 50.0,
        "notification_channel": "email",
        "notification_target": "test@test.com",
    }, headers=auth_headers)
    assert resp.status_code == 201


def test_list_alert_rules(client, auth_headers):
    resp = client.get("/api/v1/monitoring/alerts", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_update_alert_rule(client, auth_headers, test_location, db_session):
    from app.models.schedule import AlertRule
    from app.models.user import User
    user = db_session.query(User).first()
    alert = AlertRule(
        user_id=user.id,
        location_id=test_location.id,
        rule_type="custom",
        name="Test Alert",
        conditions={},
        threshold=50.0,
        notification_channel="email",
        notification_target="test@test.com",
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)

    resp = client.put(f"/api/v1/monitoring/alerts/{alert.id}", json={
        "is_active": False,
    }, headers=auth_headers)
    assert resp.status_code == 200


def test_delete_alert_rule(client, auth_headers, test_location, db_session):
    from app.models.schedule import AlertRule
    from app.models.user import User
    user = db_session.query(User).first()
    alert = AlertRule(
        user_id=user.id,
        location_id=test_location.id,
        rule_type="custom",
        name="Test Alert",
        conditions={},
        threshold=50.0,
        notification_channel="email",
        notification_target="test@test.com",
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)

    resp = client.delete(f"/api/v1/monitoring/alerts/{alert.id}", headers=auth_headers)
    assert resp.status_code == 204
