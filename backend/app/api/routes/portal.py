import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import ServiceContainer, get_container
from app.core.errors import UserAlreadyExistsError, UserNotFoundError
from app.models import (
    DashboardOverviewResponse,
    ProgressSummaryResponse,
    ResourceLibraryResponse,
    SettingsResponse,
    SettingsUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["portal"])


@router.get("/dashboard/{user_id}", response_model=DashboardOverviewResponse)
async def get_dashboard(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> DashboardOverviewResponse:
    logger.info("API /dashboard/{user_id} called | user_id=%s", user_id)
    try:
        return await container.portal_service.get_dashboard(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/progress/{user_id}", response_model=ProgressSummaryResponse)
async def get_progress(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> ProgressSummaryResponse:
    logger.info("API /progress/{user_id} called | user_id=%s", user_id)
    try:
        return await container.portal_service.get_progress(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/resources/{user_id}", response_model=ResourceLibraryResponse)
async def get_resources(
    user_id: str,
    search: str = Query(default=""),
    topic: str = Query(default="All"),
    level: str = Query(default="All"),
    resource_format: str = Query(default="All", alias="format"),
    duration: str = Query(default="All"),
    container: ServiceContainer = Depends(get_container),
) -> ResourceLibraryResponse:
    logger.info("API /resources/{user_id} called | user_id=%s", user_id)
    try:
        return await container.portal_service.get_resources(
            user_id=user_id,
            search=search,
            topic=topic,
            level=level,
            resource_format=resource_format,
            duration=duration,
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/settings/{user_id}", response_model=SettingsResponse)
async def get_settings(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> SettingsResponse:
    logger.info("API /settings/{user_id} called | user_id=%s", user_id)
    try:
        return await container.portal_service.get_settings(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/settings/{user_id}", response_model=SettingsResponse)
async def update_settings(
    user_id: str,
    payload: SettingsUpdateRequest,
    container: ServiceContainer = Depends(get_container),
) -> SettingsResponse:
    logger.info("API /settings/{user_id} PUT called | user_id=%s", user_id)
    try:
        return await container.portal_service.update_settings(user_id, payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

