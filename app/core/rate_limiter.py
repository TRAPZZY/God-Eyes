"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Rate Limiter Middleware

Creator: Trapzzy
Contact: traphubs@outlook.com

In-memory rate limiting middleware using a sliding window approach.
No Redis dependency required -- uses a thread-safe dict with timestamps.
Configurable limits per endpoint type.
"""

import time
import threading
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimiter:
    """
    Thread-safe in-memory rate limiter using a sliding window.

    Tracks request timestamps per client key (typically IP address)
    and enforces configurable request limits within a time window.
    """

    def __init__(
        self,
        default_limit: int = 60,
        window_seconds: int = 60,
        endpoint_limits: Optional[Dict[str, Tuple[int, int]]] = None,
    ):
        """
        Args:
            default_limit: Default max requests per window.
            window_seconds: Sliding window size in seconds.
            endpoint_limits: Dict mapping URL prefixes to (limit, window) tuples.
                Example: {"/api/v1/intelligence/timelapse": (5, 60)}
        """
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        self.endpoint_limits = endpoint_limits or {}

    def _get_client_key(self, request: Request) -> str:
        """Extract a unique client identifier from the request."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _get_limits(self, path: str) -> Tuple[int, int]:
        """Get the rate limit and window for a given path."""
        for prefix, (limit, window) in self.endpoint_limits.items():
            if path.startswith(prefix):
                return limit, window
        return self.default_limit, self.window_seconds

    def _clean_old_requests(self, key: str, window_seconds: int) -> None:
        """Remove timestamps outside the current window."""
        now = time.time()
        cutoff = now - window_seconds
        self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

    def is_allowed(self, request: Request) -> Tuple[bool, Dict[str, str]]:
        """
        Check if a request is within rate limits.

        Returns:
            Tuple of (allowed, headers_dict) where headers_dict contains
            X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset.
        """
        client_key = self._get_client_key(request)
        limit, window = self._get_limits(request.url.path)

        with self._lock:
            self._clean_old_requests(client_key, window)
            current_count = len(self._requests[client_key])

            now = time.time()
            reset_time = int(now + window)

            if current_count >= limit:
                headers = {
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                    "Retry-After": str(int(window)),
                }
                return False, headers

            self._requests[client_key].append(now)
            remaining = limit - current_count - 1

            headers = {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(max(0, remaining)),
                "X-RateLimit-Reset": str(reset_time),
            }
            return True, headers

    def reset(self, client_key: Optional[str] = None) -> None:
        """Reset rate limit counters. If client_key is None, reset all."""
        with self._lock:
            if client_key:
                self._requests.pop(client_key, None)
            else:
                self._requests.clear()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that applies rate limiting to all incoming requests.

    Returns a 429 Too Many Requests response when limits are exceeded.
    Adds standard rate limit headers to all responses.
    """

    def __init__(self, app, limiter: Optional[RateLimiter] = None, **limiter_kwargs):
        super().__init__(app)
        self.limiter = limiter or RateLimiter(**limiter_kwargs)
        global _global_limiter
        _global_limiter = self.limiter


_global_limiter: Optional[RateLimiter] = None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that applies rate limiting to all incoming requests.

    Returns a429 Too Many Requests response when limits are exceeded.
    Adds standard rate limit headers to all responses.
    """

    def __init__(self, app, limiter: Optional[RateLimiter] = None, **limiter_kwargs):
        super().__init__(app)
        self.limiter = limiter or RateLimiter(**limiter_kwargs)
        global _global_limiter
        _global_limiter = self.limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        allowed, headers = self.limiter.is_allowed(request)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please slow down.",
                    "retry_after": headers.get("Retry-After", 60),
                },
                headers={k: str(v) for k, v in headers.items()},
            )

        response = await call_next(request)

        for key, value in headers.items():
            response.headers[key] = str(value)

        return response


def reset_global_rate_limiter():
    """Reset the global rate limiter (useful for testing)."""
    global _global_limiter
    if _global_limiter:
        _global_limiter.reset()
