import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import ServiceContainer, get_container
from app.core.errors import InvalidQuizStateError, SessionNotFoundError
from app.models import (
    AnswerSubmission,
    QuizAnswerResponse,
    QuizResultResponse,
    StartQuizRequest,
    StartQuizResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("/start", response_model=StartQuizResponse, status_code=status.HTTP_201_CREATED)
async def start_quiz(
    payload: StartQuizRequest,
    container: ServiceContainer = Depends(get_container),
) -> StartQuizResponse:
    logger.info("API /quiz/start called | user_id=%s", payload.user_id)
    return await container.quiz_service.start_quiz(payload)


@router.post("/answer", response_model=QuizAnswerResponse)
async def answer_quiz(
    payload: AnswerSubmission,
    container: ServiceContainer = Depends(get_container),
) -> QuizAnswerResponse:
    logger.info("API /quiz/answer called | session_id=%s", payload.session_id)
    try:
        return await container.quiz_service.answer_question(payload)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidQuizStateError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/result", response_model=QuizResultResponse)
async def quiz_result(
    session_id: str = Query(..., min_length=6, max_length=80),
    container: ServiceContainer = Depends(get_container),
) -> QuizResultResponse:
    logger.info("API /quiz/result called | session_id=%s", session_id)
    try:
        return await container.quiz_service.get_result(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

