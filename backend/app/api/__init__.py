from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.locations import router as locations_router
from app.api.captures import router as captures_router
from app.api.monitoring import router as monitoring_router
from app.api.analysis import router as analysis_router
from app.api.geofencing import router as geofencing_router
from app.api.intelligence import router as intelligence_router
from app.api.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(locations_router, prefix="/locations", tags=["Locations"])
api_router.include_router(captures_router, prefix="/captures", tags=["Captures"])
api_router.include_router(monitoring_router, prefix="/monitoring", tags=["Monitoring"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(geofencing_router, prefix="/geofencing", tags=["Geofencing"])
api_router.include_router(intelligence_router, prefix="/intelligence", tags=["Intelligence"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])

__all__ = ["api_router"]
