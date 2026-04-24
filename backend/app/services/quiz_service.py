from __future__ import annotations

import logging
from collections import Counter, defaultdict
from typing import Iterable
from uuid import uuid4

from app.core.errors import InvalidQuizStateError
from app.models import (
    AnswerRecord,
    AnswerSubmission,
    ConceptPerformance,
    Difficulty,
    GeneratedQuestionPayload,
    QuizAnswerResponse,
    QuizOption,
    QuizQuestion,
    QuizResultResponse,
    QuizSession,
    StartQuizRequest,
    StartQuizResponse,
    UserPerformance,
)
from app.repositories.quiz_repository import InMemoryQuizRepository
from app.services.evaluation_service import EvaluationService
from app.services.llm import StructuredLLMClient
from app.services.question_bank import get_seed_questions
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)

_DIFFICULTY_ORDER = [Difficulty.easy, Difficulty.medium, Difficulty.hard]


class QuizService:
    def __init__(
        self,
        *,
        quiz_repository: InMemoryQuizRepository,
        llm_client: StructuredLLMClient,
        evaluation_service: EvaluationService,
        llm_generation_enabled: bool = False,
    ) -> None:
        self._quiz_repository = quiz_repository
        self._llm_client = llm_client
        self._evaluation_service = evaluation_service
        self._llm_generation_enabled = llm_generation_enabled

    @staticmethod
    def _bump_difficulty(current: Difficulty, increase: bool) -> Difficulty:
        idx = _DIFFICULTY_ORDER.index(current)
        if increase:
            return _DIFFICULTY_ORDER[min(idx + 1, len(_DIFFICULTY_ORDER) - 1)]
        return _DIFFICULTY_ORDER[max(idx - 1, 0)]

    @staticmethod
    def _question_signature(question: QuizQuestion) -> str:
        normalized_prompt = " ".join(question.prompt.strip().lower().split())
        return f"{question.concept_tag.strip().lower()}::{normalized_prompt}"

    def _concept_match_score(self, concept_tag: str, target_concepts: list[str]) -> int:
        if not target_concepts:
            return 0
        candidate = concept_tag.lower().replace("_", " ")
        for target in target_concepts:
            normalized_target = target.lower().replace("_", " ")
            if candidate in normalized_target or normalized_target in candidate:
                return 0
        return 1

    def _difficulty_distance(self, left: Difficulty, right: Difficulty) -> int:
        return abs(_DIFFICULTY_ORDER.index(left) - _DIFFICULTY_ORDER.index(right))

    def _select_from_seed(
        self,
        *,
        topic: str,
        session: QuizSession,
        target_difficulty: Difficulty,
    ) -> QuizQuestion | None:
        asked_ids = {question.question_id for question in session.asked_questions}
        asked_signatures = set(session.asked_signatures)
        concept_counts = Counter(question.concept_tag for question in session.asked_questions)
        target_concepts = [item.strip().lower() for item in session.target_concepts if item.strip()]

        bank = get_seed_questions(topic)
        candidates = [
            question
            for question in bank
            if question.question_id not in asked_ids and self._question_signature(question) not in asked_signatures
        ]
        if not candidates:
            candidates = [question for question in bank if self._question_signature(question) not in asked_signatures]
        if not candidates:
            return None

        candidates.sort(
            key=lambda question: (
                self._concept_match_score(question.concept_tag, target_concepts),
                concept_counts.get(question.concept_tag, 0),
                self._difficulty_distance(question.difficulty, target_difficulty),
                question.question_id,
            )
        )
        selected = candidates[0].model_copy(deep=True)
        selected.source = "seed_bank"
        return selected

    def _count_unique_seed_questions(self, topic: str) -> int:
        signatures = {self._question_signature(question) for question in get_seed_questions(topic)}
        return len(signatures)

    async def _generate_llm_question(
        self,
        *,
        topic: str,
        difficulty: Difficulty,
        target_concepts: list[str],
        asked_concepts: list[str],
        fallback_question: QuizQuestion,
        avoid_signatures: Iterable[str],
    ) -> QuizQuestion:
        def fallback_payload() -> GeneratedQuestionPayload:
            return GeneratedQuestionPayload(
                prompt=fallback_question.prompt,
                concept_tag=fallback_question.concept_tag,
                difficulty=fallback_question.difficulty,
                options=[opt.text for opt in fallback_question.options],
                correct_option_index=["A", "B", "C", "D"].index(fallback_question.correct_option_id),
                explanation=fallback_question.explanation,
                misconception_hints=list(fallback_question.misconception_map.values())[:3],
            )

        payload = await self._llm_client.invoke_structured(
            system_prompt=load_prompt("quiz_generation"),
            user_prompt=(
                f"Topic: {topic}\n"
                f"Difficulty: {difficulty.value}\n"
                f"Target concepts: {', '.join(target_concepts) if target_concepts else 'any relevant concept'}\n"
                f"Already covered concepts: {', '.join(asked_concepts[-6:]) if asked_concepts else 'none'}\n"
                f"Avoid repeating these signatures: {list(avoid_signatures)[-8:]}\n"
                "Rules:\n"
                "- Produce exactly 4 options.\n"
                "- Include one correct option only.\n"
                "- Explanation must teach the concept.\n"
                "- Keep question self-contained.\n"
            ),
            output_model=GeneratedQuestionPayload,
            fallback_factory=fallback_payload,
            max_retries=0,
        )

        option_ids = ["A", "B", "C", "D"]
        options = [QuizOption(option_id=option_ids[index], text=payload.options[index]) for index in range(4)]
        misconception_map: dict[str, str] = {}
        for index, hint in enumerate(payload.misconception_hints):
            if index < 4 and index != payload.correct_option_index:
                misconception_map[option_ids[index]] = hint

        return QuizQuestion(
            topic=topic,
            difficulty=payload.difficulty,
            concept_tag=payload.concept_tag,
            prompt=payload.prompt,
            options=options,
            correct_option_id=option_ids[payload.correct_option_index],
            explanation=payload.explanation,
            misconception_map=misconception_map,
            source="llm_generated",
        )

    async def _next_question(self, session: QuizSession) -> QuizQuestion | None:
        seed_question = self._select_from_seed(
            topic=session.topic,
            session=session,
            target_difficulty=session.current_difficulty,
        )
        if seed_question is not None:
            logger.info(
                "Selected seed question | session_id=%s | difficulty=%s | concept=%s",
                session.session_id,
                seed_question.difficulty,
                seed_question.concept_tag,
            )
            return seed_question

        if not self._llm_generation_enabled:
            logger.info("No more unique seed questions | session_id=%s | completing quiz", session.session_id)
            return None

        fallback_pool = get_seed_questions(session.topic)
        fallback_question = fallback_pool[0]
        for _ in range(2):
            llm_question = await self._generate_llm_question(
                topic=session.topic,
                difficulty=session.current_difficulty,
                target_concepts=session.target_concepts,
                asked_concepts=[question.concept_tag for question in session.asked_questions],
                fallback_question=fallback_question,
                avoid_signatures=session.asked_signatures,
            )
            signature = self._question_signature(llm_question)
            if signature not in set(session.asked_signatures):
                logger.info(
                    "Generated LLM question | session_id=%s | difficulty=%s | concept=%s",
                    session.session_id,
                    llm_question.difficulty,
                    llm_question.concept_tag,
                )
                return llm_question
        logger.info("LLM generated duplicate questions | session_id=%s | completing quiz", session.session_id)
        return None

    def _append_asked_question(self, session: QuizSession, question: QuizQuestion) -> None:
        session.asked_questions.append(question)
        session.asked_signatures.append(self._question_signature(question))

    async def start_quiz(self, request: StartQuizRequest) -> StartQuizResponse:
        normalized_topic = request.topic.strip().lower()
        max_seed_unique = self._count_unique_seed_questions(normalized_topic)
        if self._llm_generation_enabled:
            effective_num_questions = request.num_questions
        else:
            effective_num_questions = min(request.num_questions, max_seed_unique)
        if effective_num_questions < 3:
            raise InvalidQuizStateError("At least 3 unique diagnostic questions are required.")

        session = QuizSession(
            session_id=str(uuid4()),
            user_id=request.user_id,
            topic=normalized_topic,
            target_concepts=[item.strip().lower() for item in request.target_concepts],
            num_questions=effective_num_questions,
            current_difficulty=Difficulty.medium,
        )

        question = await self._next_question(session)
        if question is None:
            raise InvalidQuizStateError("No questions available for this topic.")
        self._append_asked_question(session, question)
        session.mark_updated()
        await self._quiz_repository.create(session)

        logger.info(
            "Quiz started | session_id=%s | user_id=%s | questions=%s | llm_enabled=%s",
            session.session_id,
            session.user_id,
            session.num_questions,
            self._llm_generation_enabled,
        )
        return StartQuizResponse(
            session_id=session.session_id,
            question_number=1,
            total_questions=session.num_questions,
            question=question,
        )

    async def answer_question(self, submission: AnswerSubmission) -> QuizAnswerResponse:
        session = await self._quiz_repository.get(submission.session_id)
        if session.completed:
            raise InvalidQuizStateError("Quiz session is already completed.")
        if not session.asked_questions:
            raise InvalidQuizStateError("No question exists for the current quiz session.")

        current_question = session.asked_questions[-1]
        if current_question.question_id != submission.question_id:
            raise InvalidQuizStateError("Submission question_id does not match current active question.")

        feedback = self._evaluation_service.evaluate(current_question, submission)
        session.answers.append(
            AnswerRecord(
                question_id=current_question.question_id,
                concept_tag=current_question.concept_tag,
                difficulty=current_question.difficulty,
                selected_option_id=submission.selected_option_id,
                confidence=submission.confidence,
                time_spent_seconds=submission.time_spent_seconds,
                is_correct=feedback.is_correct,
                conceptual_error=feedback.conceptual_error,
                guessing=feedback.guessing,
                confidence_mismatch=feedback.confidence_mismatch,
            )
        )

        if feedback.is_correct and submission.confidence >= 0.6 and submission.time_spent_seconds <= 60:
            session.current_difficulty = self._bump_difficulty(session.current_difficulty, increase=True)
        elif (not feedback.is_correct) or submission.time_spent_seconds > 90:
            session.current_difficulty = self._bump_difficulty(session.current_difficulty, increase=False)

        answered_count = len(session.answers)
        is_completed = answered_count >= session.num_questions
        next_question = None

        if not is_completed:
            next_question = await self._next_question(session)
            if next_question is None:
                is_completed = True
                session.completed = True
            else:
                self._append_asked_question(session, next_question)
        else:
            session.completed = True

        session.mark_updated()
        await self._quiz_repository.update(session)

        logger.info(
            "Quiz answer processed | session_id=%s | answered=%s/%s | completed=%s",
            session.session_id,
            answered_count,
            session.num_questions,
            is_completed,
        )
        return QuizAnswerResponse(
            session_id=session.session_id,
            feedback=feedback,
            next_question=next_question,
            question_number=answered_count + (0 if is_completed else 1),
            is_completed=is_completed,
        )

    async def get_result(self, session_id: str) -> QuizResultResponse:
        session = await self._quiz_repository.get(session_id)
        answers = session.answers

        correct_answers = sum(1 for item in answers if item.is_correct)
        overall_accuracy = (correct_answers / len(answers)) if answers else 0.0

        concept_buckets: dict[str, list[AnswerRecord]] = defaultdict(list)
        for answer in answers:
            concept_buckets[answer.concept_tag].append(answer)

        concept_performance: list[ConceptPerformance] = []
        user_performance: list[UserPerformance] = []
        for concept in sorted(concept_buckets.keys()):
            bucket = concept_buckets[concept]
            attempts = len(bucket)
            correct = sum(1 for entry in bucket if entry.is_correct)
            avg_time = sum(entry.time_spent_seconds for entry in bucket) / attempts
            avg_confidence = sum(entry.confidence for entry in bucket) / attempts
            conceptual_errors = sum(1 for entry in bucket if entry.conceptual_error is not None)
            guessing_signals = sum(1 for entry in bucket if entry.guessing)
            confidence_mismatches = sum(1 for entry in bucket if entry.confidence_mismatch)
            accuracy = correct / attempts if attempts else 0.0

            concept_performance.append(
                ConceptPerformance(
                    concept=concept,
                    attempts=attempts,
                    correct=correct,
                    accuracy=accuracy,
                    avg_time=round(avg_time, 2),
                    confidence=round(avg_confidence, 3),
                    conceptual_errors=conceptual_errors,
                    guessing_signals=guessing_signals,
                    confidence_mismatches=confidence_mismatches,
                )
            )

            user_performance.append(
                UserPerformance(
                    concept=concept,
                    accuracy=accuracy,
                    avg_time=round(avg_time, 2),
                    confidence=round(avg_confidence, 3),
                )
            )

        logger.info("Quiz result generated | session_id=%s | accuracy=%.3f", session_id, overall_accuracy)
        return QuizResultResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            topic=session.topic,
            total_questions=session.num_questions,
            answered_questions=len(answers),
            correct_answers=correct_answers,
            overall_accuracy=round(overall_accuracy, 3),
            concept_performance=concept_performance,
            user_performance=user_performance,
        )

    async def get_latest_result_for_user(self, user_id: str, topic: str | None = None) -> QuizResultResponse:
        sessions = await self._quiz_repository.list_by_user(user_id)
        if topic:
            sessions = [session for session in sessions if session.topic == topic.strip().lower()]
        if not sessions:
            raise InvalidQuizStateError("No quiz data available for this user and topic.")
        return await self.get_result(sessions[0].session_id)

