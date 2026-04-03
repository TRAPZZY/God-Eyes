"""
God Eyes - Defense-Grade Satellite Intelligence Platform
FastAPI Application Entry Point

Creator: Trapzzy
Contact: traphubs@outlook.com

Main application factory that configures the FastAPI instance with
middleware, CORS, static file serving, and API router registration.
Production-ready with comprehensive OpenAPI documentation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import signal
import logging
from app.config import get_settings
from app.api import api_router
from app.database import engine, Base
from app.workers.scheduler import scheduler
from app.core.rate_limiter import RateLimitMiddleware
from app.core.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    RequestSizeLimiterMiddleware,
)

settings = get_settings()

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("godeyes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting God Eyes platform...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "captures"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "diffs"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "ndvi"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "exports"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "timelapse"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "reports"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "heatmaps"), exist_ok=True)
    os.makedirs("data", exist_ok=True)
    from app.database import engine, Base, is_sqlite
    if is_sqlite:
        logger.info("SQLite mode: creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("SQLite tables created")
    scheduler.start()
    logger.info("God Eyes platform started successfully")

    shutdown_event = app.state.shutdown_event

    def handle_signal(signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        shutdown_event.set()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    yield

    logger.info("Shutting down God Eyes platform...")
    scheduler.stop()
    logger.info("God Eyes platform stopped")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "God Eyes - Defense-Grade Satellite Intelligence Platform\n\n"
        "A comprehensive satellite monitoring and analysis platform providing:\n"
        "- High-resolution satellite imagery from Mapbox and Sentinel Hub\n"
        "- Automated change detection with AI-powered analysis\n"
        "- Scheduled monitoring with customizable alert rules\n"
        "- Geofencing and perimeter-based alerts\n"
        "- NDVI vegetation health analysis\n"
        "- Multi-resolution image capture (up to 8K)\n"
        "- Historical imagery comparison and time-lapse generation\n\n"
        "**Creator:** Trapzzy\n"
        "**Contact:** traphubs@outlook.com\n"
        "**Version:** " + settings.APP_VERSION
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.state.shutdown_event = __import__("asyncio").Event()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimiterMiddleware)

app.add_middleware(
    RateLimitMiddleware,
    default_limit=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60,
    endpoint_limits={
        "/api/v1/intelligence/timelapse": (5, 60),
        "/api/v1/intelligence/report": (10, 60),
        "/api/v1/intelligence/heatmap": (10, 60),
        "/api/v1/auth/login": (5, 60),
        "/api/v1/auth/register": (3, 60),
    },
)

app.include_router(api_router, prefix=settings.API_PREFIX)

upload_dir = os.path.join(os.path.dirname(__file__), "..", settings.UPLOAD_DIR)
if os.path.exists(upload_dir):
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "creator": "Trapzzy",
        "contact": "traphubs@outlook.com",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}
