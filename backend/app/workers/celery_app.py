from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "godeyes",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
)

from app.workers.capture_tasks import scheduled_capture_task, batch_capture_task
from app.workers.analysis_tasks import change_detection_task, scheduled_analysis_task

celery_app.conf.beat_schedule = {
    "run-scheduled-captures": {
        "task": "app.workers.capture_tasks.scheduled_capture_task",
        "schedule": 300.0,
    },
    "run-scheduled-analysis": {
        "task": "app.workers.analysis_tasks.scheduled_analysis_task",
        "schedule": 600.0,
    },
}
