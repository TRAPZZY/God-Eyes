try:
    from app.workers.celery_app import celery_app
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False
    celery_app = None

__all__ = ["celery_app", "HAS_CELERY"]
