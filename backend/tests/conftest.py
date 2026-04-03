"""
God Eyes - Test Configuration and Fixtures
"""
import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.location import Location, Geofence, Annotation
from app.models.capture import Capture, ChangeDetection
from app.models.schedule import MonitoringSchedule, AlertRule
from app.core.security import get_password_hash, create_access_token
from fastapi.testclient import TestClient

# Prevent scheduler from interfering with tests
import signal
_original_signal = signal.signal
def _safe_signal(sig, handler):
    try:
        return _original_signal(sig, handler)
    except (ValueError, OSError):
        return None
signal.signal = _safe_signal

from app.main import app


TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def engine():
    eng = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture(scope="function")
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    from app.core.rate_limiter import reset_global_rate_limiter
    reset_global_rate_limiter()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = User(
        email="test@godeyes.com",
        username="testuser",
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Test User",
        role=UserRole.OPERATOR,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin@godeyes.com",
        username="adminuser",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_token(test_user):
    return create_access_token(data={"sub": str(test_user.id), "type": "access"})


@pytest.fixture
def admin_token(admin_user):
    return create_access_token(data={"sub": str(admin_user.id), "type": "access"})


@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_location(db_session, test_user):
    location = Location(
        user_id=test_user.id,
        name="Test Location",
        latitude=38.8977,
        longitude=-77.0365,
        zoom_level=15.0,
        is_monitored=False,
    )
    db_session.add(location)
    db_session.commit()
    db_session.refresh(location)
    return location


@pytest.fixture
def test_geofence(db_session, test_location):
    import json
    geofence = Geofence(
        location_id=test_location.id,
        name="Test Geofence",
        coordinates=json.dumps([
            [-77.0380, 38.8990], [-77.0350, 38.8990],
            [-77.0350, 38.8960], [-77.0380, 38.8960],
            [-77.0380, 38.8990],
        ]),
        alert_on_change=True,
    )
    db_session.add(geofence)
    db_session.commit()
    db_session.refresh(geofence)
    return geofence
