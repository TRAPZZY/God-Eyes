"""Tests for authentication endpoints."""
from fastapi.testclient import TestClient
from app.core.security import get_password_hash


def test_register(client: TestClient, db_session):
    resp = client.post("/api/v1/auth/register", json={
        "email": "newuser@test.com",
        "username": "newuser",
        "password": "SecurePass123!",
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@test.com"
    assert data["username"] == "newuser"


def test_login(client: TestClient, test_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@godeyes.com",
        "password": "TestPass123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@godeyes.com",
        "password": "WrongPassword!",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={
        "email": "nobody@test.com",
        "password": "SomePass123!",
    })
    assert resp.status_code == 401


def test_token_refresh(client: TestClient, test_user):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "test@godeyes.com",
        "password": "TestPass123!",
    })
    refresh_token = login_resp.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


def test_change_password(client: TestClient, test_user, auth_headers):
    resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "TestPass123!",
        "new_password": "NewSecurePass456!",
    }, headers=auth_headers)
    assert resp.status_code == 200

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "test@godeyes.com",
        "password": "NewSecurePass456!",
    })
    assert login_resp.status_code == 200


def test_change_password_wrong_current(client: TestClient, test_user, auth_headers):
    resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "WrongPassword!",
        "new_password": "NewSecurePass456!",
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_register_duplicate_email(client: TestClient, test_user):
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@godeyes.com",
        "username": "duplicate",
        "password": "SecurePass123!",
    })
    assert resp.status_code == 400


def test_register_invalid_password(client: TestClient):
    resp = client.post("/api/v1/auth/register", json={
        "email": "weak@test.com",
        "username": "weakuser",
        "password": "123",
    })
    assert resp.status_code == 422
