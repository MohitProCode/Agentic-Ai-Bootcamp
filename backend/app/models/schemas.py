from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class TaskType(str, Enum):
    learn = "learn"
    practice = "practice"
    revision = "revision"
    assessment = "assessment"


class QuizOption(BaseModel):
    option_id: str = Field(min_length=1, max_length=10)
    text: str = Field(min_length=1, max_length=400)


class QuizQuestion(BaseModel):
    question_id: str = Field(default_factory=lambda: str(uuid4()))
    topic: str = Field(min_length=2, max_length=120)
    difficulty: Difficulty
    concept_tag: str = Field(min_length=2, max_length=120)
    prompt: str = Field(min_length=8, max_length=1200)
    options: list[QuizOption] = Field(min_length=4, max_length=4)
    correct_option_id: str = Field(min_length=1, max_length=10)
    explanation: str = Field(min_length=8, max_length=1200)
    misconception_map: dict[str, str] = Field(default_factory=dict)
    source: str = Field(default="generated", min_length=3, max_length=40)

    @model_validator(mode="after")
    def validate_correct_option(self) -> "QuizQuestion":
        option_ids = {opt.option_id for opt in self.options}
        if self.correct_option_id not in option_ids:
            raise ValueError("correct_option_id must exist in options.")
        return self


class StartQuizRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=100)
    topic: str = Field(min_length=2, max_length=120)
    target_concepts: list[str] = Field(default_factory=list, max_length=20)
    num_questions: int = Field(default=8, ge=3, le=25)


class StartQuizResponse(BaseModel):
    session_id: str
    question_number: int
    total_questions: int
    question: QuizQuestion


class AnswerSubmission(BaseModel):
    session_id: str = Field(min_length=6, max_length=80)
    question_id: str = Field(min_length=6, max_length=80)
    selected_option_id: str = Field(min_length=1, max_length=10)
    confidence: float = Field(ge=0.0, le=1.0)
    time_spent_seconds: int = Field(ge=1, le=900)


class AnswerFeedback(BaseModel):
    is_correct: bool
    explanation: str
    conceptual_error: str | None = None
    guessing: bool = False
    confidence_mismatch: bool = False


class AnswerRecord(BaseModel):
    question_id: str
    concept_tag: str
    difficulty: Difficulty
    selected_option_id: str
    confidence: float
    time_spent_seconds: int
    is_correct: bool
    conceptual_error: str | None = None
    guessing: bool = False
    confidence_mismatch: bool = False
    created_at: datetime = Field(default_factory=utc_now)


class QuizAnswerResponse(BaseModel):
    session_id: str
    feedback: AnswerFeedback
    next_question: QuizQuestion | None = None
    question_number: int
    is_completed: bool


class UserPerformance(BaseModel):
    concept: str
    accuracy: float = Field(ge=0.0, le=1.0)
    avg_time: float = Field(ge=0.0)
    confidence: float = Field(ge=0.0, le=1.0)


class ConceptPerformance(BaseModel):
    concept: str
    attempts: int = Field(ge=0)
    correct: int = Field(ge=0)
    accuracy: float = Field(ge=0.0, le=1.0)
    avg_time: float = Field(ge=0.0)
    confidence: float = Field(ge=0.0, le=1.0)
    conceptual_errors: int = Field(ge=0)
    guessing_signals: int = Field(ge=0)
    confidence_mismatches: int = Field(ge=0)


class QuizResultResponse(BaseModel):
    session_id: str
    user_id: str
    topic: str
    total_questions: int
    answered_questions: int
    correct_answers: int
    overall_accuracy: float = Field(ge=0.0, le=1.0)
    concept_performance: list[ConceptPerformance] = Field(default_factory=list)
    user_performance: list[UserPerformance] = Field(default_factory=list)


class GapAnalysisItem(BaseModel):
    concept: str
    weakness_score: float = Field(ge=0.0, le=1.0)
    misconceptions: list[str] = Field(default_factory=list, max_length=10)
    recommendation: str = Field(min_length=3, max_length=500)
    priority_rank: int = Field(ge=1, le=50)


class GapAnalysisReport(BaseModel):
    user_id: str
    topic: str
    weak_concepts: list[GapAnalysisItem] = Field(default_factory=list)
    summary: str = Field(min_length=3, max_length=1000)
    generated_at: datetime = Field(default_factory=utc_now)


class FreeResource(BaseModel):
    resource_id: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=200)
    url: HttpUrl
    provider: str = Field(min_length=2, max_length=120)
    resource_type: str = Field(min_length=2, max_length=40)
    concept_tags: list[str] = Field(default_factory=list, max_length=30)
    estimated_minutes: int = Field(ge=5, le=300)
    is_free: bool = True
    notes: str | None = Field(default=None, max_length=500)


class DailyTask(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3, max_length=600)
    task_type: TaskType
    concept_tag: str = Field(min_length=2, max_length=120)
    difficulty: Difficulty
    estimated_minutes: int = Field(ge=10, le=240)
    resource: FreeResource | None = None


class DailyPlan(BaseModel):
    day: str = Field(min_length=3, max_length=20)
    daily_tasks: list[DailyTask] = Field(default_factory=list)

    @field_validator("daily_tasks")
    @classmethod
    def validate_task_count(cls, value: list[DailyTask]) -> list[DailyTask]:
        if len(value) > 3:
            raise ValueError("Each day can have at most 3 tasks.")
        return value


class WeekPlan(BaseModel):
    week: int = Field(ge=1, le=52)
    goal: str = Field(min_length=3, max_length=400)
    daily_tasks: list[DailyPlan] = Field(default_factory=list)


class LearningPlan(BaseModel):
    user_id: str
    topic: str
    weeks: list[WeekPlan] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)


class PlanValidationIssue(BaseModel):
    severity: str = Field(pattern="^(low|medium|high)$")
    message: str = Field(min_length=3, max_length=500)


class PlanValidationReport(BaseModel):
    is_valid: bool
    issues: list[PlanValidationIssue] = Field(default_factory=list)
    auto_fixed: bool = False


class PlanGenerateRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=100)
    topic: str = Field(min_length=2, max_length=120)
    weeks: int = Field(default=4, ge=1, le=12)
    quiz_session_id: str | None = Field(default=None, min_length=6, max_length=80)


class PlanGenerateResponse(BaseModel):
    plan: LearningPlan
    gap_report: GapAnalysisReport
    validation: PlanValidationReport


class QuizSession(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    session_id: str
    user_id: str
    topic: str
    target_concepts: list[str] = Field(default_factory=list)
    num_questions: int = Field(ge=3, le=25)
    current_difficulty: Difficulty = Difficulty.medium
    asked_questions: list[QuizQuestion] = Field(default_factory=list)
    asked_signatures: list[str] = Field(default_factory=list)
    answers: list[AnswerRecord] = Field(default_factory=list)
    completed: bool = False
    started_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    def mark_updated(self) -> None:
        self.updated_at = utc_now()


class GeneratedQuestionPayload(BaseModel):
    prompt: str = Field(min_length=8, max_length=1200)
    concept_tag: str = Field(min_length=2, max_length=120)
    difficulty: Difficulty
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=8, max_length=1200)
    misconception_hints: list[str] = Field(default_factory=list, max_length=4)


class LLMGapReasoningItem(BaseModel):
    concept: str
    misconception: str
    recommendation: str
    priority_rank: int = Field(ge=1, le=50)


class LLMGapReasoningPayload(BaseModel):
    weak_concepts: list[LLMGapReasoningItem] = Field(default_factory=list, max_length=20)
    summary: str = Field(min_length=3, max_length=1000)


class LLMResourceSelectionItem(BaseModel):
    concept: str
    resource_ids: list[str] = Field(default_factory=list, max_length=5)
    rationale: str = Field(min_length=3, max_length=400)


class LLMResourceSelectionPayload(BaseModel):
    selections: list[LLMResourceSelectionItem] = Field(default_factory=list, max_length=20)


class LLMTaskDraft(BaseModel):
    day: str = Field(min_length=3, max_length=20)
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3, max_length=600)
    task_type: TaskType
    concept_tag: str = Field(min_length=2, max_length=120)
    difficulty: Difficulty
    estimated_minutes: int = Field(ge=10, le=240)
    resource_id: str | None = None


class LLMWeekDraft(BaseModel):
    week: int = Field(ge=1, le=52)
    goal: str = Field(min_length=3, max_length=400)
    tasks: list[LLMTaskDraft] = Field(default_factory=list, max_length=21)


class LLMPlanDraftPayload(BaseModel):
    weeks: list[LLMWeekDraft] = Field(default_factory=list, max_length=12)


class LLMPlanValidationPayload(BaseModel):
    is_valid: bool
    issues: list[PlanValidationIssue] = Field(default_factory=list, max_length=20)


class AuthUser(BaseModel):
    user_id: str = Field(min_length=2, max_length=100)
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    avatar_url: str = Field(default="https://api.dicebear.com/8.x/identicon/svg?seed=lumina")
    role: str = Field(default="learner", min_length=2, max_length=40)
    created_at: datetime = Field(default_factory=utc_now)


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=200)
    invite_code: str | None = Field(default=None, max_length=80)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=200)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


class GoalPreferences(BaseModel):
    target_role: str = Field(min_length=2, max_length=80)
    focus_skills: list[str] = Field(default_factory=list, max_length=20)
    weekly_hours: int = Field(ge=2, le=80)
    target_timeframe: str = Field(min_length=3, max_length=80)
    learning_style: str = Field(min_length=3, max_length=80)
    content_language: str = Field(min_length=2, max_length=50)


class OnboardingGoalRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=100)
    preferences: GoalPreferences


class OnboardingGoalResponse(BaseModel):
    user_id: str
    preferences: GoalPreferences
    saved_at: datetime = Field(default_factory=utc_now)


class DashboardMetric(BaseModel):
    label: str = Field(min_length=2, max_length=80)
    value: str = Field(min_length=1, max_length=80)
    subtitle: str = Field(min_length=1, max_length=120)
    trend: str = Field(pattern="^(up|down|steady)$")


class DashboardTaskItem(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    details: str = Field(min_length=2, max_length=240)
    status: str = Field(pattern="^(completed|in_progress|pending)$")
    required: bool = False


class PathNode(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    module: str = Field(min_length=2, max_length=80)
    status: str = Field(pattern="^(completed|in_progress|locked)$")


class AnnouncementItem(BaseModel):
    category: str = Field(min_length=2, max_length=60)
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=2, max_length=500)
    posted_at: str = Field(min_length=2, max_length=80)


class ConsistencyPoint(BaseModel):
    day: str = Field(min_length=2, max_length=12)
    hours: float = Field(ge=0.0, le=12.0)


class DashboardOverviewResponse(BaseModel):
    user_id: str
    welcome_title: str = Field(min_length=2, max_length=200)
    streak_days: int = Field(ge=0, le=365)
    rank_label: str = Field(min_length=2, max_length=50)
    upcoming_lesson: str = Field(min_length=2, max_length=200)
    upcoming_minutes_remaining: int = Field(ge=0, le=600)
    metrics: list[DashboardMetric] = Field(default_factory=list, max_length=8)
    tasks: list[DashboardTaskItem] = Field(default_factory=list, max_length=10)
    path_nodes: list[PathNode] = Field(default_factory=list, max_length=12)
    announcements: list[AnnouncementItem] = Field(default_factory=list, max_length=12)
    consistency: list[ConsistencyPoint] = Field(default_factory=list, max_length=14)


class ProgressTrendPoint(BaseModel):
    label: str = Field(min_length=2, max_length=20)
    score: float = Field(ge=0.0, le=100.0)


class SkillMasteryPoint(BaseModel):
    skill: str = Field(min_length=2, max_length=80)
    score: float = Field(ge=0.0, le=100.0)


class HeatmapCell(BaseModel):
    week: str = Field(min_length=2, max_length=12)
    day: str = Field(min_length=2, max_length=12)
    intensity: int = Field(ge=0, le=5)


class CoachingNote(BaseModel):
    mentor: str = Field(min_length=2, max_length=120)
    posted_at: str = Field(min_length=2, max_length=80)
    note: str = Field(min_length=2, max_length=600)


class ProgressSummaryResponse(BaseModel):
    user_id: str
    plan_completion: int = Field(ge=0, le=100)
    time_spent_hours: float = Field(ge=0.0, le=10000.0)
    quiz_average: int = Field(ge=0, le=100)
    weekly_goals_completed: int = Field(ge=0, le=20)
    weekly_goals_target: int = Field(ge=1, le=20)
    trend_points: list[ProgressTrendPoint] = Field(default_factory=list, max_length=20)
    skill_mastery: list[SkillMasteryPoint] = Field(default_factory=list, max_length=20)
    heatmap: list[HeatmapCell] = Field(default_factory=list, max_length=120)
    coaching_notes: list[CoachingNote] = Field(default_factory=list, max_length=20)


class LibraryResourceCard(BaseModel):
    resource_id: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=2, max_length=400)
    resource_type: str = Field(min_length=2, max_length=40)
    level: str = Field(pattern="^(Beginner|Intermediate|Advanced)$")
    duration_minutes: int = Field(ge=1, le=360)
    tags: list[str] = Field(default_factory=list, max_length=10)
    match_score: int = Field(ge=0, le=100)
    saved: bool = False
    url: HttpUrl


class ResourceAnalyticsSegment(BaseModel):
    label: str = Field(min_length=2, max_length=80)
    count: int = Field(ge=0, le=10000)


class ResourceLibraryResponse(BaseModel):
    user_id: str
    recommended: list[LibraryResourceCard] = Field(default_factory=list, max_length=20)
    resources: list[LibraryResourceCard] = Field(default_factory=list, max_length=80)
    analytics: list[ResourceAnalyticsSegment] = Field(default_factory=list, max_length=20)
    topics: list[str] = Field(default_factory=list, max_length=30)
    saved_count: int = Field(ge=0, le=1000)


class ProfileSettings(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=5, max_length=200)
    bio: str = Field(default="Learner focused on consistent, deliberate growth.", max_length=400)
    avatar_url: str = Field(default="https://api.dicebear.com/8.x/identicon/svg?seed=lumina")


class AppPreferences(BaseModel):
    language: str = Field(default="English", min_length=2, max_length=40)
    timezone: str = Field(default="Asia/Kolkata", min_length=2, max_length=80)
    notifications_enabled: bool = True
    weekly_report_enabled: bool = True
    appearance: str = Field(default="Dark", pattern="^(Dark|Light|System)$")


class SettingsResponse(BaseModel):
    user_id: str
    profile: ProfileSettings
    preferences: AppPreferences


class ProfileSettingsUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    email: str | None = Field(default=None, min_length=5, max_length=200)
    bio: str | None = Field(default=None, max_length=400)
    avatar_url: str | None = None


class AppPreferencesUpdate(BaseModel):
    language: str | None = Field(default=None, min_length=2, max_length=40)
    timezone: str | None = Field(default=None, min_length=2, max_length=80)
    notifications_enabled: bool | None = None
    weekly_report_enabled: bool | None = None
    appearance: str | None = Field(default=None, pattern="^(Dark|Light|System)$")


class SettingsUpdateRequest(BaseModel):
    profile: ProfileSettingsUpdate | None = None
    preferences: AppPreferencesUpdate | None = None
