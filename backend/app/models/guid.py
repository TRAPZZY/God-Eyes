"""
Cross-database UUID type helper.
Uses PostgreSQL UUID when available, falls back to String(36) for SQLite.
"""
from sqlalchemy import String, TypeDecorator
import uuid


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL UUID type, otherwise uses String(36) with UUID conversion.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value

    def process_literal_param(self, value, dialect):
        return f"'{value}'"


def get_uuid_column(primary_key=False, **kwargs):
    """Create a UUID column that works on both PostgreSQL and SQLite."""
    from sqlalchemy import Column
    default = kwargs.pop("default", uuid.uuid4)
    if primary_key:
        return Column(GUID(), primary_key=True, default=default, **kwargs)
    return Column(GUID(), default=default, **kwargs)
