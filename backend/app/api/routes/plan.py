import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import ServiceContainer, get_container
from app.core.errors import InvalidQuizStateError, PlanNotFoundError, SessionNotFoundError
from app.models import LearningPlan, PlanGenerateRequest, PlanGenerateResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plan", tags=["plan"])


@router.post("/generate", response_model=PlanGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_plan(
    payload: PlanGenerateRequest,
    container: ServiceContainer = Depends(get_container),
) -> PlanGenerateResponse:
    logger.info("API /plan/generate called | user_id=%s", payload.user_id)
    try:
        return await container.plan_pipeline_service.generate_plan(payload)
    except (InvalidQuizStateError, SessionNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{user_id}", response_model=LearningPlan)
async def get_plan(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> LearningPlan:
    logger.info("API /plan/{user_id} called | user_id=%s", user_id)
    try:
        return await container.plan_pipeline_service.get_plan(user_id)
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/report/{user_id}", response_model=PlanGenerateResponse)
async def get_plan_report(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> PlanGenerateResponse:
    logger.info("API /plan/report/{user_id} called | user_id=%s", user_id)
    try:
        return await container.plan_pipeline_service.get_plan_report(user_id)
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
