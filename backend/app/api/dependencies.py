from functools import lru_cache

from app.core.config import Settings, get_settings
from app.repositories.plan_repository import InMemoryPlanRepository
from app.repositories.quiz_repository import InMemoryQuizRepository
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.services.evaluation_service import EvaluationService
from app.services.gap_analysis_service import KnowledgeGapAnalyzer
from app.services.llm import StructuredLLMClient
from app.services.onboarding_service import OnboardingService
from app.services.pipeline_service import PlanPipelineService
from app.services.plan_service import LearningPlanService
from app.services.portal_service import PortalService
from app.services.quiz_service import QuizService
from app.services.resource_service import ResourceService


class ServiceContainer:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.quiz_repository = InMemoryQuizRepository()
        self.plan_repository = InMemoryPlanRepository()
        self.user_repository = InMemoryUserRepository()

        self.llm_client = StructuredLLMClient(settings=settings)
        self.evaluation_service = EvaluationService(target_time_seconds=settings.quiz_target_time_seconds)
        self.quiz_service = QuizService(
            quiz_repository=self.quiz_repository,
            llm_client=self.llm_client,
            evaluation_service=self.evaluation_service,
            llm_generation_enabled=settings.quiz_llm_generation_enabled,
        )
        self.gap_analyzer = KnowledgeGapAnalyzer(
            llm_client=self.llm_client,
            target_time_seconds=settings.quiz_target_time_seconds,
            llm_enrichment_enabled=settings.plan_llm_enrichment_enabled,
        )
        self.resource_service = ResourceService(
            llm_client=self.llm_client,
            llm_enrichment_enabled=settings.plan_llm_enrichment_enabled,
        )
        self.plan_service = LearningPlanService(
            llm_client=self.llm_client,
            gap_analyzer=self.gap_analyzer,
            resource_service=self.resource_service,
            llm_enrichment_enabled=settings.plan_llm_enrichment_enabled,
        )
        self.plan_pipeline_service = PlanPipelineService(
            quiz_service=self.quiz_service,
            plan_service=self.plan_service,
            plan_repository=self.plan_repository,
        )
        self.auth_service = AuthService(user_repository=self.user_repository)
        self.onboarding_service = OnboardingService(user_repository=self.user_repository)
        self.portal_service = PortalService(
            user_repository=self.user_repository,
            plan_repository=self.plan_repository,
            quiz_service=self.quiz_service,
        )


@lru_cache(maxsize=1)
def get_container() -> ServiceContainer:
    return ServiceContainer(settings=get_settings())
