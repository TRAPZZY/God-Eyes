"""Tests for LRU cache."""
import time
from app.core.cache import LRUCache, CacheEntry, get_cache


def test_cache_basic():
    cache = LRUCache(max_size=3, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    assert cache.get("a") == 1
    assert cache.get("b") == 2
    assert cache.get("c") == 3


def test_cache_lru_eviction():
    cache = LRUCache(max_size=3, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    cache.get("a")
    cache.set("d", 4)
    assert cache.get("b") is None
    assert cache.get("a") == 1
    assert cache.get("d") == 4


def test_cache_ttl_expiration():
    cache = LRUCache(max_size=10, default_ttl=1)
    cache.set("x", "value")
    assert cache.get("x") == "value"
    time.sleep(1.1)
    assert cache.get("x") is None


def test_cache_delete():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("k", "v")
    assert cache.delete("k") is True
    assert cache.get("k") is None
    assert cache.delete("nonexistent") is False


def test_cache_clear():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.clear()
    assert cache.size == 0


def test_cache_cleanup_expired():
    cache = LRUCache(max_size=10, default_ttl=1)
    cache.set("a", 1)
    cache.set("b", 2)
    time.sleep(1.1)
    cache.set("c", 3)
    removed = cache.cleanup_expired()
    assert removed == 2
    assert cache.size == 1


def test_cache_stats():
    cache = LRUCache(max_size=10, default_ttl=60)
    cache.set("a", 1)
    cache.get("a")
    cache.get("missing")
    stats = cache.stats
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["size"] == 1
    assert stats["hit_rate_percent"] == 50.0


def test_cache_decorator():
    cache = LRUCache(max_size=10, default_ttl=60)
    call_count = [0]

    @cache.cached(ttl=60)
    def expensive_fn(x):
        call_count[0] += 1
        return x * 2

    assert expensive_fn(5) == 10
    assert expensive_fn(5) == 10
    assert call_count[0] == 1


def test_global_cache():
    cache = get_cache()
    assert isinstance(cache, LRUCache)
    assert cache.max_size == 256


def test_cache_entry_expiration():
    entry = CacheEntry("value", ttl=1)
    assert not entry.is_expired
    assert entry.value == "value"
    assert entry.access_count == 0
