import asyncio

from app.core.errors import PlanNotFoundError
from app.models import LearningPlan, PlanGenerateResponse


class InMemoryPlanRepository:
    def __init__(self) -> None:
        self._plans: dict[str, LearningPlan] = {}
        self._reports: dict[str, PlanGenerateResponse] = {}
        self._lock = asyncio.Lock()

    async def save(self, plan: LearningPlan) -> LearningPlan:
        async with self._lock:
            self._plans[plan.user_id] = plan.model_copy(deep=True)
            return self._plans[plan.user_id].model_copy(deep=True)

    async def get_by_user(self, user_id: str) -> LearningPlan:
        async with self._lock:
            plan = self._plans.get(user_id)
            if plan is None:
                raise PlanNotFoundError(f"No plan found for user '{user_id}'.")
            return plan.model_copy(deep=True)

    async def save_report(self, report: PlanGenerateResponse) -> PlanGenerateResponse:
        async with self._lock:
            self._reports[report.plan.user_id] = report.model_copy(deep=True)
            return self._reports[report.plan.user_id].model_copy(deep=True)

    async def get_report_by_user(self, user_id: str) -> PlanGenerateResponse:
        async with self._lock:
            report = self._reports.get(user_id)
            if report is None:
                raise PlanNotFoundError(f"No plan report found for user '{user_id}'.")
            return report.model_copy(deep=True)
