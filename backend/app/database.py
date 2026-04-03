"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Database Connection Module

Creator: Trapzzy
Contact: traphubs@outlook.com

Handles SQLAlchemy engine creation, session management,
and connection pooling for production-grade database operations.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
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
