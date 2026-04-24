from __future__ import annotations

import logging
from collections import defaultdict

from app.models import (
    DailyPlan,
    DailyTask,
    Difficulty,
    FreeResource,
    GapAnalysisReport,
    LLMPlanDraftPayload,
    LLMPlanValidationPayload,
    LearningPlan,
    PlanValidationIssue,
    PlanValidationReport,
    QuizResultResponse,
    TaskType,
    WeekPlan,
)
from app.services.gap_analysis_service import KnowledgeGapAnalyzer
from app.services.llm import StructuredLLMClient
from app.services.resource_service import ResourceService
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)

_WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
_DIFFICULTY_PROGRESS = [Difficulty.easy, Difficulty.medium, Difficulty.hard]


class LearningPlanService:
    def __init__(
        self,
        *,
        llm_client: StructuredLLMClient,
        gap_analyzer: KnowledgeGapAnalyzer,
        resource_service: ResourceService,
        llm_enrichment_enabled: bool = False,
    ) -> None:
        self._llm_client = llm_client
        self._gap_analyzer = gap_analyzer
        self._resource_service = resource_service
        self._llm_enrichment_enabled = llm_enrichment_enabled

    @staticmethod
    def _difficulty_for_week(week_num: int, total_weeks: int) -> Difficulty:
        if total_weeks <= 1:
            return Difficulty.easy
        ratio = (week_num - 1) / max(total_weeks - 1, 1)
        if ratio < 0.34:
            return Difficulty.easy
        if ratio < 0.67:
            return Difficulty.medium
        return Difficulty.hard

    @staticmethod
    def _resource_lookup(resources_by_concept: dict[str, list[FreeResource]]) -> dict[str, FreeResource]:
        lookup: dict[str, FreeResource] = {}
        for resources in resources_by_concept.values():
            for resource in resources:
                lookup[resource.resource_id] = resource
        return lookup

    def _heuristic_plan(
        self,
        *,
        user_id: str,
        topic: str,
        weeks: int,
        gap_report: GapAnalysisReport,
        resources_by_concept: dict[str, list[FreeResource]],
    ) -> LearningPlan:
        if gap_report.weak_concepts:
            concepts = [item.concept for item in gap_report.weak_concepts]
        else:
            concepts = [topic]

        week_plans: list[WeekPlan] = []
        for week_idx in range(1, weeks + 1):
            difficulty = self._difficulty_for_week(week_idx, weeks)
            daily_plans: list[DailyPlan] = []

            for day_idx, day_name in enumerate(_WEEK_DAYS):
                day_tasks: list[DailyTask] = []

                if day_name == "Sunday":
                    concept = concepts[(week_idx + day_idx) % len(concepts)]
                    revision_resource = (resources_by_concept.get(concept) or [None])[0]
                    day_tasks.append(
                        DailyTask(
                            title=f"Revision cycle: {concept}",
                            description="Review notes, revisit mistakes, and summarize key takeaways.",
                            task_type=TaskType.revision,
                            concept_tag=concept,
                            difficulty=Difficulty.easy if difficulty == Difficulty.easy else Difficulty.medium,
                            estimated_minutes=45,
                            resource=revision_resource,
                        )
                    )
                else:
                    concept = concepts[(week_idx + day_idx - 1) % len(concepts)]
                    resources = resources_by_concept.get(concept, [])
                    primary = resources[0] if resources else None
                    secondary = resources[1] if len(resources) > 1 else primary

                    day_tasks.append(
                        DailyTask(
                            title=f"Learn: {concept}",
                            description="Study core concept material and capture concise notes.",
                            task_type=TaskType.learn,
                            concept_tag=concept,
                            difficulty=difficulty,
                            estimated_minutes=40,
                            resource=primary,
                        )
                    )
                    day_tasks.append(
                        DailyTask(
                            title=f"Practice: {concept}",
                            description="Solve targeted exercises and check explanations for mistakes.",
                            task_type=TaskType.practice,
                            concept_tag=concept,
                            difficulty=difficulty,
                            estimated_minutes=35,
                            resource=secondary,
                        )
                    )

                    if day_name == "Saturday":
                        day_tasks.append(
                            DailyTask(
                                title=f"Assessment: {concept}",
                                description="Take a short self-test and log confidence vs accuracy.",
                                task_type=TaskType.assessment,
                                concept_tag=concept,
                                difficulty=difficulty,
                                estimated_minutes=30,
                                resource=primary,
                            )
                        )

                daily_plans.append(DailyPlan(day=day_name, daily_tasks=day_tasks[:3]))

            top_concepts = ", ".join(concepts[:3])
            week_plans.append(
                WeekPlan(
                    week=week_idx,
                    goal=f"Strengthen {top_concepts} with {difficulty.value}-level mastery.",
                    daily_tasks=daily_plans,
                )
            )

        return LearningPlan(user_id=user_id, topic=topic, weeks=week_plans)

    def _llm_fallback_draft(
        self,
        *,
        user_id: str,
        topic: str,
        weeks: int,
        gap_report: GapAnalysisReport,
        resources_by_concept: dict[str, list[FreeResource]],
    ) -> LLMPlanDraftPayload:
        heuristic = self._heuristic_plan(
            user_id=user_id,
            topic=topic,
            weeks=weeks,
            gap_report=gap_report,
            resources_by_concept=resources_by_concept,
        )

        llm_weeks: list[dict[str, object]] = []
        for week in heuristic.weeks:
            tasks: list[dict[str, object]] = []
            for day in week.daily_tasks:
                for task in day.daily_tasks:
                    tasks.append(
                        {
                            "day": day.day,
                            "title": task.title,
                            "description": task.description,
                            "task_type": task.task_type,
                            "concept_tag": task.concept_tag,
                            "difficulty": task.difficulty,
                            "estimated_minutes": task.estimated_minutes,
                            "resource_id": task.resource.resource_id if task.resource else None,
                        }
                    )
            llm_weeks.append({"week": week.week, "goal": week.goal, "tasks": tasks})
        return LLMPlanDraftPayload(weeks=llm_weeks)

    def _draft_to_learning_plan(
        self,
        *,
        user_id: str,
        topic: str,
        draft: LLMPlanDraftPayload,
        resources_by_id: dict[str, FreeResource],
    ) -> LearningPlan:
        week_plans: list[WeekPlan] = []
        for week_draft in draft.weeks:
            bucket: dict[str, list[DailyTask]] = defaultdict(list)
            for task in week_draft.tasks:
                resource = resources_by_id.get(task.resource_id) if task.resource_id else None
                bucket[task.day].append(
                    DailyTask(
                        title=task.title,
                        description=task.description,
                        task_type=task.task_type,
                        concept_tag=task.concept_tag,
                        difficulty=task.difficulty,
                        estimated_minutes=task.estimated_minutes,
                        resource=resource.model_copy(deep=True) if resource else None,
                    )
                )

            daily = [DailyPlan(day=day, daily_tasks=bucket.get(day, [])[:3]) for day in _WEEK_DAYS]
            week_plans.append(WeekPlan(week=week_draft.week, goal=week_draft.goal, daily_tasks=daily))
        return LearningPlan(user_id=user_id, topic=topic, weeks=week_plans)

    @staticmethod
    def _validate_plan_rules(plan: LearningPlan) -> PlanValidationReport:
        issues: list[PlanValidationIssue] = []

        for week in plan.weeks:
            revision_count = 0
            for day in week.daily_tasks:
                if len(day.daily_tasks) > 3:
                    issues.append(
                        PlanValidationIssue(
                            severity="high",
                            message=f"Week {week.week} - {day.day} exceeds 3 tasks/day.",
                        )
                    )
                revision_count += sum(1 for task in day.daily_tasks if task.task_type == TaskType.revision)

            if revision_count == 0:
                issues.append(
                    PlanValidationIssue(
                        severity="medium",
                        message=f"Week {week.week} has no revision cycle.",
                    )
                )

        week_levels: list[int] = []
        for week in plan.weeks:
            numeric = 0
            count = 0
            for day in week.daily_tasks:
                for task in day.daily_tasks:
                    numeric += _DIFFICULTY_PROGRESS.index(task.difficulty)
                    count += 1
            week_levels.append(round(numeric / count, 3) if count else 0)

        for idx in range(1, len(week_levels)):
            if week_levels[idx] + 0.05 < week_levels[idx - 1]:
                issues.append(
                    PlanValidationIssue(
                        severity="medium",
                        message="Difficulty progression regresses between consecutive weeks.",
                    )
                )
                break

        return PlanValidationReport(is_valid=len(issues) == 0, issues=issues, auto_fixed=False)

    @staticmethod
    def _apply_auto_fixes(plan: LearningPlan) -> LearningPlan:
        fixed = plan.model_copy(deep=True)
        for week in fixed.weeks:
            difficulty = LearningPlanService._difficulty_for_week(week.week, len(fixed.weeks))
            has_revision = False

            for day in week.daily_tasks:
                if len(day.daily_tasks) > 3:
                    day.daily_tasks = day.daily_tasks[:3]
                for task in day.daily_tasks:
                    task.difficulty = difficulty if task.task_type != TaskType.revision else Difficulty.easy
                    if task.task_type == TaskType.revision:
                        has_revision = True

            if not has_revision:
                sunday = next((day for day in week.daily_tasks if day.day == "Sunday"), None)
                if sunday is None:
                    sunday = DailyPlan(day="Sunday", daily_tasks=[])
                    week.daily_tasks.append(sunday)
                sunday.daily_tasks = sunday.daily_tasks[:2]
                sunday.daily_tasks.append(
                    DailyTask(
                        title=f"Revision cycle (Week {week.week})",
                        description="Consolidate key concepts and revisit incorrect attempts.",
                        task_type=TaskType.revision,
                        concept_tag=week.goal[:80],
                        difficulty=Difficulty.easy,
                        estimated_minutes=40,
                    )
                )
        return fixed

    async def _review_with_llm(self, plan: LearningPlan) -> LLMPlanValidationPayload:
        def fallback() -> LLMPlanValidationPayload:
            return LLMPlanValidationPayload(is_valid=True, issues=[])

        return await self._llm_client.invoke_structured(
            system_prompt=load_prompt("reviewer"),
            user_prompt=(
                f"Plan topic: {plan.topic}\n"
                f"Weeks: {len(plan.weeks)}\n"
                f"Plan payload: {plan.model_dump()}\n"
                "Check constraints: max 3 tasks/day, includes revision cycles, progressive difficulty."
            ),
            output_model=LLMPlanValidationPayload,
            fallback_factory=fallback,
            max_retries=0,
        )

    async def generate_plan(
        self,
        *,
        quiz_result: QuizResultResponse,
        weeks: int,
    ) -> tuple[LearningPlan, GapAnalysisReport, PlanValidationReport]:
        logger.info("Plan generation started | user_id=%s", quiz_result.user_id)
        gap_report = await self._gap_analyzer.analyze(quiz_result)
        resources_by_concept = await self._resource_service.recommend_resources(gap_report)
        resource_lookup = self._resource_lookup(resources_by_concept)

        fallback_draft = self._llm_fallback_draft(
            user_id=quiz_result.user_id,
            topic=quiz_result.topic,
            weeks=weeks,
            gap_report=gap_report,
            resources_by_concept=resources_by_concept,
        )

        if self._llm_enrichment_enabled:
            llm_draft = await self._llm_client.invoke_structured(
                system_prompt=load_prompt("planner"),
                user_prompt=(
                    f"User ID: {quiz_result.user_id}\n"
                    f"Topic: {quiz_result.topic}\n"
                    f"Weeks required: {weeks}\n"
                    f"Weak concepts with priority: {[item.model_dump() for item in gap_report.weak_concepts]}\n"
                    f"Available free resources: {resources_by_concept}\n"
                    "Constraints:\n"
                    "- Max 3 tasks/day\n"
                    "- Include at least one revision task every week\n"
                    "- Increase difficulty progressively across weeks\n"
                    "- Use only resource IDs from the provided list\n"
                ),
                output_model=LLMPlanDraftPayload,
                fallback_factory=lambda: fallback_draft,
                max_retries=0,
            )
        else:
            llm_draft = fallback_draft

        plan = self._draft_to_learning_plan(
            user_id=quiz_result.user_id,
            topic=quiz_result.topic,
            draft=llm_draft,
            resources_by_id=resource_lookup,
        )

        rule_validation = self._validate_plan_rules(plan)
        if self._llm_enrichment_enabled:
            llm_validation = await self._review_with_llm(plan)
        else:
            llm_validation = LLMPlanValidationPayload(is_valid=True, issues=[])

        merged_issues = list(rule_validation.issues)
        if not llm_validation.is_valid:
            merged_issues.extend(llm_validation.issues)

        validation = PlanValidationReport(is_valid=len(merged_issues) == 0, issues=merged_issues, auto_fixed=False)

        if not validation.is_valid:
            fixed_plan = self._apply_auto_fixes(plan)
            fixed_validation = self._validate_plan_rules(fixed_plan)
            validation = PlanValidationReport(
                is_valid=fixed_validation.is_valid,
                issues=fixed_validation.issues,
                auto_fixed=True,
            )
            plan = fixed_plan

        logger.info(
            "Plan generation completed | user_id=%s | valid=%s | issues=%s",
            quiz_result.user_id,
            validation.is_valid,
            len(validation.issues),
        )
        return plan, gap_report, validation
