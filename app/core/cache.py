"""
God Eyes - Defense-Grade Satellite Intelligence Platform
LRU Cache with TTL Expiration

Creator: Trapzzy
Contact: traphubs@outlook.com

Thread-safe LRU cache for satellite images and API responses.
Uses TTL-based expiration to ensure stale data is purged.
Integrates with mapbox and sentinel services for transparent caching.
"""

import time
import threading
import hashlib
from collections import OrderedDict
from typing import Any, Optional, Callable, Dict


class CacheEntry:
    """Single cache entry with value and expiration metadata."""

    __slots__ = ["value", "expires_at", "created_at", "access_count"]

    def __init__(self, value: Any, ttl: int):
        self.value = value
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl
        self.access_count = 0

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class LRUCache:
    """
    Thread-safe LRU cache with TTL-based expiration.

    Evicts least recently used entries when capacity is reached.
    Entries are also evicted when their TTL expires.
    """

    def __init__(self, max_size: int = 256, default_ttl: int = 300):
        """
        Args:
            max_size: Maximum number of entries in the cache.
            default_ttl: Default time-to-live in seconds for cached entries.
        """
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.Lock()
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.hits = 0
        self.misses = 0

    def _make_key(self, *args, **kwargs) -> str:
        """Generate a deterministic cache key from arguments."""
        key_parts = [str(a) for a in args]
        for k in sorted(kwargs.keys()):
            key_parts.append(f"{k}={kwargs[k]}")
        raw = "|".join(key_parts)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value from the cache.

        Returns None if the key doesn't exist or the entry has expired.
        Updates access order for LRU tracking.
        """
        with self._lock:
            if key not in self._cache:
                self.misses += 1
                return None

            entry = self._cache[key]
            if entry.is_expired:
                del self._cache[key]
                self.misses += 1
                return None

            entry.access_count += 1
            self._cache.move_to_end(key)
            self.hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store a value in the cache with optional TTL override.

        Evicts the least recently used entry if the cache is full.
        """
        effective_ttl = ttl if ttl is not None else self.default_ttl

        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                self._cache[key] = CacheEntry(value, effective_ttl)
                return

            if len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)

            self._cache[key] = CacheEntry(value, effective_ttl)

    def delete(self, key: str) -> bool:
        """Remove a specific entry from the cache."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Remove all entries from the cache."""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        removed = 0
        with self._lock:
            expired_keys = [
                k for k, v in self._cache.items() if v.is_expired
            ]
            for key in expired_keys:
                del self._cache[key]
                removed += 1
        return removed

    @property
    def size(self) -> int:
        """Current number of entries in the cache."""
        return len(self._cache)

    @property
    def stats(self) -> Dict[str, Any]:
        """Cache performance statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0.0
        return {
            "size": self.size,
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_percent": round(hit_rate, 2),
            "default_ttl": self.default_ttl,
        }

    def cached(self, ttl: Optional[int] = None):
        """
        Decorator that caches the return value of a function.

        Usage:
            @cache.cached(ttl=600)
            def expensive_function(arg1, arg2):
                ...
        """
        def decorator(func: Callable):
            def wrapper(*args, **kwargs):
                key = self._make_key(func.__name__, *args, **kwargs)
                result = self.get(key)
                if result is not None:
                    return result
                result = func(*args, **kwargs)
                self.set(key, result, ttl=ttl)
                return result
            return wrapper
        return decorator


_global_cache = LRUCache(max_size=256, default_ttl=300)


def get_cache() -> LRUCache:
    """Get the global cache instance."""
    return _global_cache
