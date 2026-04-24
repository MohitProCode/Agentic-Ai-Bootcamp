import logging

from app.models import AnswerFeedback, AnswerSubmission, QuizQuestion

logger = logging.getLogger(__name__)


class EvaluationService:
    def __init__(self, target_time_seconds: int = 45) -> None:
        self._target_time_seconds = target_time_seconds

    def evaluate(self, question: QuizQuestion, submission: AnswerSubmission) -> AnswerFeedback:
        is_correct = submission.selected_option_id == question.correct_option_id
        conceptual_error = None

        if not is_correct:
            conceptual_error = question.misconception_map.get(
                submission.selected_option_id,
                "incorrect_concept_application",
            )

        fast_threshold = max(8, int(self._target_time_seconds * 0.2))
        guessing = (submission.time_spent_seconds <= fast_threshold and submission.confidence <= 0.35) or (
            submission.time_spent_seconds <= 6 and not is_correct
        )

        confidence_mismatch = (not is_correct and submission.confidence >= 0.7) or (
            is_correct and submission.confidence <= 0.3
        )

        logger.info(
            "Evaluated answer | question_id=%s | correct=%s | guessing=%s | confidence_mismatch=%s",
            question.question_id,
            is_correct,
            guessing,
            confidence_mismatch,
        )

        return AnswerFeedback(
            is_correct=is_correct,
            explanation=question.explanation,
            conceptual_error=conceptual_error,
            guessing=guessing,
            confidence_mismatch=confidence_mismatch,
        )

