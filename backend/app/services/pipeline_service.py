import logging

from app.agents.crew_pipeline import agent_specs, stage_prompts
from app.models import LearningPlan, PlanGenerateRequest, PlanGenerateResponse
from app.repositories.plan_repository import InMemoryPlanRepository
from app.services.plan_service import LearningPlanService
from app.services.quiz_service import QuizService

logger = logging.getLogger(__name__)


class PlanPipelineService:
    def __init__(
        self,
        *,
        quiz_service: QuizService,
        plan_service: LearningPlanService,
        plan_repository: InMemoryPlanRepository,
    ) -> None:
        self._quiz_service = quiz_service
        self._plan_service = plan_service
        self._plan_repository = plan_repository
        self._agent_specs = agent_specs()
        self._stage_prompts = stage_prompts()
        # CrewAI execution metadata can be toggled on later, while LangChain remains the LLM runtime.
        self._metadata_crew = None

    async def generate_plan(self, request: PlanGenerateRequest) -> PlanGenerateResponse:
        logger.info("Plan pipeline started | user_id=%s | topic=%s", request.user_id, request.topic)
        logger.info("Crew agents loaded: %s", [agent["name"] for agent in self._agent_specs])
        logger.debug("Stage prompts: %s", self._stage_prompts)

        if request.quiz_session_id:
            quiz_result = await self._quiz_service.get_result(request.quiz_session_id)
        else:
            quiz_result = await self._quiz_service.get_latest_result_for_user(request.user_id, request.topic)

        plan, gap_report, validation = await self._plan_service.generate_plan(
            quiz_result=quiz_result,
            weeks=request.weeks,
        )

        saved_plan = await self._plan_repository.save(plan)
        generated_report = PlanGenerateResponse(plan=saved_plan, gap_report=gap_report, validation=validation)
        saved_report = await self._plan_repository.save_report(generated_report)
        logger.info("Plan pipeline completed | user_id=%s | valid=%s", request.user_id, validation.is_valid)
        return saved_report

    async def get_plan(self, user_id: str) -> LearningPlan:
        return await self._plan_repository.get_by_user(user_id)

    async def get_plan_report(self, user_id: str) -> PlanGenerateResponse:
        return await self._plan_repository.get_report_by_user(user_id)
