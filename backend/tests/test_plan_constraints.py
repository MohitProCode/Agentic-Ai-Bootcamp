from app.models import DailyPlan, DailyTask, Difficulty, LearningPlan, TaskType, WeekPlan
from app.services.plan_service import LearningPlanService


def test_plan_validation_flags_missing_revision() -> None:
    week = WeekPlan(
        week=1,
        goal="Goal",
        daily_tasks=[
            DailyPlan(
                day="Monday",
                daily_tasks=[
                    DailyTask(
                        title="Learn",
                        description="Read docs",
                        task_type=TaskType.learn,
                        concept_tag="concept",
                        difficulty=Difficulty.easy,
                        estimated_minutes=30,
                    )
                ],
            )
        ],
    )
    plan = LearningPlan(user_id="u1", topic="python", weeks=[week])

    report = LearningPlanService._validate_plan_rules(plan)
    assert report.is_valid is False
    assert any("revision" in issue.message.lower() for issue in report.issues)

