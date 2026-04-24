import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import ServiceContainer, get_container
from app.core.errors import UserNotFoundError
from app.models import OnboardingGoalRequest, OnboardingGoalResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/goals", response_model=OnboardingGoalResponse, status_code=status.HTTP_201_CREATED)
async def save_goals(
    payload: OnboardingGoalRequest,
    container: ServiceContainer = Depends(get_container),
) -> OnboardingGoalResponse:
    logger.info("API /onboarding/goals called | user_id=%s", payload.user_id)
    try:
        return await container.onboarding_service.save_goals(payload)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/goals/{user_id}", response_model=OnboardingGoalResponse)
async def get_goals(
    user_id: str,
    container: ServiceContainer = Depends(get_container),
) -> OnboardingGoalResponse:
    logger.info("API /onboarding/goals/{user_id} called | user_id=%s", user_id)
    try:
        payload = await container.onboarding_service.get_goals(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding goals not found.")
    return payload

