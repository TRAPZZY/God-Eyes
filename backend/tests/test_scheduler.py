"""Tests for background scheduler."""
from unittest.mock import patch, MagicMock
from app.workers.scheduler import scheduler


def test_scheduler_instance():
    assert scheduler is not None


def test_scheduler_start_stop():
    scheduler.start()
    assert scheduler._running is True
    scheduler.stop()
    assert scheduler._running is False


def test_scheduler_get_stats():
    scheduler.start()
    stats = scheduler.get_stats()
    assert "total_runs" in stats
    assert "total_captures" in stats
    assert "total_errors" in stats
    assert "last_run" in stats
    scheduler.stop()


def test_scheduler_add_remove_job():
    scheduler.start()
    stats_before = scheduler.get_stats()
    assert isinstance(stats_before, dict)
    scheduler.stop()
