from app.models import OnboardingGoalRequest, OnboardingGoalResponse
from app.repositories.user_repository import InMemoryUserRepository


class OnboardingService:
    def __init__(self, user_repository: InMemoryUserRepository) -> None:
        self._user_repository = user_repository

    async def save_goals(self, payload: OnboardingGoalRequest) -> OnboardingGoalResponse:
        preferences = await self._user_repository.save_goals(payload.user_id, payload.preferences)
        return OnboardingGoalResponse(user_id=payload.user_id, preferences=preferences)

    async def get_goals(self, user_id: str) -> OnboardingGoalResponse | None:
        preferences = await self._user_repository.get_goals(user_id)
        if preferences is None:
            return None
        return OnboardingGoalResponse(user_id=user_id, preferences=preferences)

