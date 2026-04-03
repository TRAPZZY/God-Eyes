"""Tests for rate limiter."""
from unittest.mock import MagicMock
from app.core.rate_limiter import RateLimiter, RateLimitMiddleware
from starlette.middleware.base import BaseHTTPMiddleware


def test_rate_limiter_basic():
    limiter = RateLimiter(default_limit=5, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "127.0.0.1"
    mock_req.headers = {}
    for _ in range(5):
        allowed, _ = limiter.is_allowed(mock_req)
        assert allowed is True
    allowed, headers = limiter.is_allowed(mock_req)
    assert allowed is False
    assert "Retry-After" in headers


def test_rate_limiter_per_endpoint():
    limiter = RateLimiter(
        default_limit=60,
        window_seconds=60,
        endpoint_limits={"/api/timelapse": (2, 60)},
    )
    mock_req = MagicMock()
    mock_req.client.host = "10.0.0.1"
    mock_req.headers = {}
    mock_req.url.path = "/api/timelapse/generate"
    limiter.is_allowed(mock_req)
    limiter.is_allowed(mock_req)
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is False


def test_rate_limiter_headers():
    limiter = RateLimiter(default_limit=10, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "192.168.1.1"
    mock_req.headers = {}
    allowed, headers = limiter.is_allowed(mock_req)
    assert allowed is True
    assert headers["X-RateLimit-Limit"] == "10"
    assert headers["X-RateLimit-Remaining"] == "9"


def test_rate_limiter_forwarded_for():
    limiter = RateLimiter(default_limit=5, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "127.0.0.1"
    mock_req.headers = {"x-forwarded-for": "203.0.113.50, 70.41.3.18"}
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is True


def test_rate_limiter_reset():
    limiter = RateLimiter(default_limit=2, window_seconds=60)
    mock_req = MagicMock()
    mock_req.url.path = "/api/test"
    mock_req.client.host = "10.0.0.5"
    mock_req.headers = {}
    limiter.is_allowed(mock_req)
    limiter.is_allowed(mock_req)
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is False
    limiter.reset("10.0.0.5")
    allowed, _ = limiter.is_allowed(mock_req)
    assert allowed is True


def test_rate_limiter_different_ips():
    limiter = RateLimiter(default_limit=1, window_seconds=60)
    req1 = MagicMock()
    req1.url.path = "/api/test"
    req1.client.host = "1.1.1.1"
    req1.headers = {}
    req2 = MagicMock()
    req2.url.path = "/api/test"
    req2.client.host = "2.2.2.2"
    req2.headers = {}
    limiter.is_allowed(req1)
    allowed1, _ = limiter.is_allowed(req1)
    assert allowed1 is False
    allowed2, _ = limiter.is_allowed(req2)
    assert allowed2 is True


def test_rate_limiter_middleware_inheritance():
    assert issubclass(RateLimitMiddleware, BaseHTTPMiddleware)


def test_rate_limit_headers_in_response(client, auth_headers):
    resp = client.get("/api/v1/locations/", headers=auth_headers)
    assert "X-RateLimit-Limit" in resp.headers
    assert "X-RateLimit-Remaining" in resp.headers
