"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Database Connection Module

Creator: Trapzzy
Contact: traphubs@outlook.com

Auto-detects SQLite (for single-server/free tier) or PostgreSQL (for production).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

db_url = settings.database_url
is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        db_url,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session per request.
    Ensures proper session cleanup after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
