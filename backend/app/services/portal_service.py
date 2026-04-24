from __future__ import annotations

from collections import Counter

from app.core.errors import InvalidQuizStateError, PlanNotFoundError
from app.models import (
    AnnouncementItem,
    CoachingNote,
    ConsistencyPoint,
    DashboardMetric,
    DashboardOverviewResponse,
    DashboardTaskItem,
    HeatmapCell,
    LibraryResourceCard,
    PathNode,
    ProgressSummaryResponse,
    ProgressTrendPoint,
    ResourceAnalyticsSegment,
    ResourceLibraryResponse,
    SettingsResponse,
    SettingsUpdateRequest,
    SkillMasteryPoint,
)
from app.repositories.plan_repository import InMemoryPlanRepository
from app.repositories.user_repository import InMemoryUserRepository
from app.services.question_bank import get_seed_questions
from app.services.quiz_service import QuizService
from app.services.resource_catalog import list_resources


class PortalService:
    def __init__(
        self,
        *,
        user_repository: InMemoryUserRepository,
        plan_repository: InMemoryPlanRepository,
        quiz_service: QuizService,
    ) -> None:
        self._user_repository = user_repository
        self._plan_repository = plan_repository
        self._quiz_service = quiz_service

    async def _latest_quiz_average(self, user_id: str) -> int:
        try:
            result = await self._quiz_service.get_latest_result_for_user(user_id)
            return int(round(result.overall_accuracy * 100))
        except InvalidQuizStateError:
            return 85

    async def _consistency_points(self) -> list[ConsistencyPoint]:
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        values = [2.4, 1.5, 2.8, 1.2, 3.3, 2.7, 1.8]
        return [ConsistencyPoint(day=label, hours=hours) for label, hours in zip(labels, values)]

    async def get_dashboard(self, user_id: str) -> DashboardOverviewResponse:
        user = await self._user_repository.get_user(user_id)
        quiz_average = await self._latest_quiz_average(user_id)

        try:
            plan = await self._plan_repository.get_by_user(user_id)
        except PlanNotFoundError:
            plan = None

        tasks: list[DashboardTaskItem] = []
        path_nodes: list[PathNode] = []
        upcoming_lesson = "Advanced React Hooks"
        upcoming_minutes = 45

        if plan and plan.weeks:
            week_one = plan.weeks[0]
            day_tasks = week_one.daily_tasks[0].daily_tasks if week_one.daily_tasks else []
            for idx, task in enumerate(day_tasks[:3]):
                status = "completed" if idx == 0 else "in_progress" if idx == 1 else "pending"
                tasks.append(
                    DashboardTaskItem(
                        title=task.title,
                        details=f"{task.estimated_minutes} min | {task.concept_tag}",
                        status=status,
                        required=task.task_type in {"assessment", "practice"},
                    )
                )
            goals = [week.goal for week in plan.weeks[:4]]
            for idx, goal in enumerate(goals):
                status = "completed" if idx < 2 else "in_progress" if idx == 2 else "locked"
                path_nodes.append(PathNode(title=goal, module=f"Module {idx + 1}", status=status))
            upcoming_lesson = week_one.goal[:80]
            upcoming_minutes = 35
        else:
            tasks = [
                DashboardTaskItem(
                    title="Review Custom Hooks",
                    details="Completed 2 hours ago",
                    status="completed",
                    required=False,
                ),
                DashboardTaskItem(
                    title="Complete Hooks Quiz",
                    details="15 questions | Est. 20 mins",
                    status="in_progress",
                    required=True,
                ),
                DashboardTaskItem(
                    title="Read: Context API vs Redux",
                    details="Supplementary material",
                    status="pending",
                    required=False,
                ),
            ]
            path_nodes = [
                PathNode(title="React Fundamentals", module="Module 1", status="completed"),
                PathNode(title="State & Props", module="Module 2", status="completed"),
                PathNode(title="Advanced Hooks", module="Module 3", status="in_progress"),
                PathNode(title="Performance Optimization", module="Module 4", status="locked"),
            ]

        announcements = [
            AnnouncementItem(
                category="Live Session",
                title="Q&A: React Performance Tuning",
                message="Join instructor Sarah for a deep dive into useMemo and React.memo patterns.",
                posted_at="Today, 2:00 PM",
            ),
            AnnouncementItem(
                category="New Resource",
                title="Updated Cheat Sheet",
                message="A downloadable PDF covering common custom hooks patterns has been added.",
                posted_at="Yesterday",
            ),
        ]

        metrics = [
            DashboardMetric(label="Plan Completion", value="68%", subtitle="+12% this week", trend="up"),
            DashboardMetric(label="Time Spent", value="42h 15m", subtitle="+5h above target", trend="up"),
            DashboardMetric(label="Quiz Average", value=f"{quiz_average}%", subtitle="Steady", trend="steady"),
            DashboardMetric(label="Weekly Goals", value="4/5", subtitle="1 goal remaining", trend="steady"),
        ]

        return DashboardOverviewResponse(
            user_id=user_id,
            welcome_title=f"Welcome back, {user.full_name.split(' ')[0]}",
            streak_days=4,
            rank_label="Silver",
            upcoming_lesson=upcoming_lesson,
            upcoming_minutes_remaining=upcoming_minutes,
            metrics=metrics,
            tasks=tasks,
            path_nodes=path_nodes,
            announcements=announcements,
            consistency=await self._consistency_points(),
        )

    async def get_progress(self, user_id: str) -> ProgressSummaryResponse:
        quiz_average = await self._latest_quiz_average(user_id)
        try:
            latest = await self._quiz_service.get_latest_result_for_user(user_id)
        except InvalidQuizStateError:
            latest = None

        trend = [
            ProgressTrendPoint(label="Week 1", score=max(55, quiz_average - 20)),
            ProgressTrendPoint(label="Week 2", score=max(58, quiz_average - 14)),
            ProgressTrendPoint(label="Week 3", score=max(61, quiz_average - 16)),
            ProgressTrendPoint(label="Week 4", score=max(68, quiz_average - 4)),
            ProgressTrendPoint(label="Week 5", score=float(quiz_average)),
        ]

        if latest and latest.concept_performance:
            mastery = [
                SkillMasteryPoint(skill=item.concept.replace("_", " ").title(), score=round(item.accuracy * 100, 1))
                for item in latest.concept_performance[:5]
            ]
        else:
            mastery = [
                SkillMasteryPoint(skill="React", score=80),
                SkillMasteryPoint(skill="JavaScript", score=62),
                SkillMasteryPoint(skill="Node.js", score=55),
                SkillMasteryPoint(skill="HTML", score=68),
                SkillMasteryPoint(skill="CSS", score=74),
            ]

        heat_values = [
            [1, 2, 3, 4, 2, 2, 3],
            [2, 4, 3, 3, 2, 3, 4],
            [1, 3, 2, 4, 3, 2, 2],
            [4, 3, 2, 1, 4, 3, 2],
        ]
        week_labels = ["W1", "W2", "W3", "W4"]
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        heatmap: list[HeatmapCell] = []
        for week_idx, row in enumerate(heat_values):
            for day_idx, intensity in enumerate(row):
                heatmap.append(HeatmapCell(week=week_labels[week_idx], day=day_labels[day_idx], intensity=intensity))

        notes = [
            CoachingNote(
                mentor="Sarah Jenkins",
                posted_at="Yesterday",
                note=(
                    "Great progress on your React hooks module. For next week, focus on advanced routing "
                    "concepts and attempt two extra practice assessments."
                ),
            ),
            CoachingNote(
                mentor="Sarah Jenkins",
                posted_at="Last Week",
                note="You managed consistent daily effort. Keep the pace and increase challenge gradually.",
            ),
        ]

        return ProgressSummaryResponse(
            user_id=user_id,
            plan_completion=68,
            time_spent_hours=42.25,
            quiz_average=quiz_average,
            weekly_goals_completed=4,
            weekly_goals_target=5,
            trend_points=trend,
            skill_mastery=mastery,
            heatmap=heatmap,
            coaching_notes=notes,
        )

    @staticmethod
    def _level_from_minutes(minutes: int) -> str:
        if minutes <= 18:
            return "Beginner"
        if minutes <= 40:
            return "Intermediate"
        return "Advanced"

    @staticmethod
    def _score_from_tags(tags: list[str], focus: set[str]) -> int:
        overlap = len({tag.lower() for tag in tags}.intersection(focus))
        return min(99, 72 + overlap * 9)

    async def get_resources(
        self,
        *,
        user_id: str,
        search: str = "",
        topic: str = "All",
        level: str = "All",
        resource_format: str = "All",
        duration: str = "All",
    ) -> ResourceLibraryResponse:
        _ = await self._user_repository.get_user(user_id)
        goals = await self._user_repository.get_goals(user_id)
        saved_ids = await self._user_repository.get_saved_resource_ids(user_id)
        focus = {item.lower() for item in (goals.focus_skills if goals else ["python", "react", "machine learning"])}

        cards: list[LibraryResourceCard] = []
        catalog = list_resources()
        for resource in catalog:
            tag_title = [tag.replace("_", " ").title() for tag in resource.concept_tags[:4]]
            cards.append(
                LibraryResourceCard(
                    resource_id=resource.resource_id,
                    title=resource.title,
                    description=resource.notes or "Curated free material for your path.",
                    resource_type=resource.resource_type.title(),
                    level=self._level_from_minutes(resource.estimated_minutes),
                    duration_minutes=resource.estimated_minutes,
                    tags=tag_title,
                    match_score=self._score_from_tags(resource.concept_tags, focus),
                    saved=resource.resource_id in saved_ids,
                    url=resource.url,
                )
            )

        for question in get_seed_questions("python fundamentals")[:3]:
            cards.append(
                LibraryResourceCard(
                    resource_id=f"practice-{question.question_id}",
                    title=f"Interactive Practice: {question.concept_tag.replace('_', ' ').title()}",
                    description="Hands-on coding exercise with guided hints and explanations.",
                    resource_type="Interactive",
                    level="Intermediate",
                    duration_minutes=22,
                    tags=[question.concept_tag.replace("_", " ").title(), "Practice"],
                    match_score=90,
                    saved=False,
                    url="https://www.kaggle.com/learn",
                )
            )

        if search.strip():
            needle = search.strip().lower()
            cards = [
                card
                for card in cards
                if needle in card.title.lower()
                or needle in card.description.lower()
                or any(needle in tag.lower() for tag in card.tags)
            ]

        if topic != "All":
            cards = [card for card in cards if any(topic.lower() in tag.lower() for tag in card.tags)]
        if level != "All":
            cards = [card for card in cards if card.level == level]
        if resource_format != "All":
            cards = [card for card in cards if card.resource_type.lower() == resource_format.lower()]
        if duration == "Short":
            cards = [card for card in cards if card.duration_minutes < 20]
        elif duration == "Medium":
            cards = [card for card in cards if 20 <= card.duration_minutes <= 45]
        elif duration == "Long":
            cards = [card for card in cards if card.duration_minutes > 45]

        cards.sort(key=lambda item: item.match_score, reverse=True)
        recommended = cards[:3]

        topic_counter: Counter[str] = Counter()
        for card in cards:
            if card.tags:
                topic_counter[card.tags[0]] += 1
        analytics = [
            ResourceAnalyticsSegment(label=label, count=count)
            for label, count in topic_counter.most_common(5)
        ]
        topics = [label for label, _ in topic_counter.most_common(8)]

        return ResourceLibraryResponse(
            user_id=user_id,
            recommended=recommended,
            resources=cards[:30],
            analytics=analytics,
            topics=topics,
            saved_count=sum(1 for card in cards if card.saved),
        )

    async def get_settings(self, user_id: str) -> SettingsResponse:
        return await self._user_repository.get_settings(user_id)

    async def update_settings(self, user_id: str, payload: SettingsUpdateRequest) -> SettingsResponse:
        return await self._user_repository.update_settings(user_id, payload)

