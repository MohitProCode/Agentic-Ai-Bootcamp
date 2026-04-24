from app.models import AnswerSubmission, Difficulty, QuizOption, QuizQuestion
from app.services.evaluation_service import EvaluationService


def test_evaluation_detects_confidence_mismatch_when_wrong_and_confident() -> None:
    question = QuizQuestion(
        question_id="q-1",
        topic="python fundamentals",
        difficulty=Difficulty.easy,
        concept_tag="data_types",
        prompt="Which is immutable?",
        options=[
            QuizOption(option_id="A", text="list"),
            QuizOption(option_id="B", text="dict"),
            QuizOption(option_id="C", text="set"),
            QuizOption(option_id="D", text="tuple"),
        ],
        correct_option_id="D",
        explanation="Tuple is immutable.",
        misconception_map={"A": "mutability_confusion"},
    )
    submission = AnswerSubmission(
        session_id="session-1",
        question_id="question-1",
        selected_option_id="A",
        confidence=0.9,
        time_spent_seconds=15,
    )

    feedback = EvaluationService().evaluate(question, submission)
    assert feedback.is_correct is False
    assert feedback.confidence_mismatch is True
    assert feedback.conceptual_error == "mutability_confusion"
