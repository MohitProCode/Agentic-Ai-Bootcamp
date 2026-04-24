import asyncio

from app.models import AnswerSubmission, StartQuizRequest
from app.repositories.quiz_repository import InMemoryQuizRepository
from app.services.evaluation_service import EvaluationService
from app.services.quiz_service import QuizService


class DummyLLMClient:
    def __init__(self) -> None:
        self.calls = 0

    async def invoke_structured(self, **kwargs):  # noqa: ANN003
        self.calls += 1
        return kwargs["fallback_factory"]()


def test_quiz_avoids_repeated_seed_questions_and_skips_llm_when_disabled() -> None:
    async def run_flow() -> None:
        llm_client = DummyLLMClient()
        service = QuizService(
            quiz_repository=InMemoryQuizRepository(),
            llm_client=llm_client,
            evaluation_service=EvaluationService(),
            llm_generation_enabled=False,
        )

        start = await service.start_quiz(
            StartQuizRequest(
                user_id="learner_001",
                topic="python fundamentals",
                num_questions=6,
            )
        )

        seen_prompts = {start.question.prompt.strip().lower()}
        current_question = start.question
        session_id = start.session_id

        completed = False
        while not completed:
            submission = AnswerSubmission(
                session_id=session_id,
                question_id=current_question.question_id,
                selected_option_id=current_question.correct_option_id,
                confidence=0.8,
                time_spent_seconds=20,
            )
            response = await service.answer_question(submission)
            completed = response.is_completed
            if response.next_question is not None:
                normalized_prompt = response.next_question.prompt.strip().lower()
                assert normalized_prompt not in seen_prompts
                seen_prompts.add(normalized_prompt)
                current_question = response.next_question

        result = await service.get_result(session_id)
        assert result.answered_questions == len(seen_prompts)
        assert llm_client.calls == 0

    asyncio.run(run_flow())

