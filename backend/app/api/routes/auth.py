import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import ServiceContainer, get_container
from app.core.errors import AuthenticationError, UserAlreadyExistsError
from app.models import AuthResponse, LoginRequest, SignupRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    container: ServiceContainer = Depends(get_container),
) -> AuthResponse:
    logger.info("API /auth/signup called | email=%s", payload.email)
    try:
        return await container.auth_service.signup(payload)
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    container: ServiceContainer = Depends(get_container),
) -> AuthResponse:
    logger.info("API /auth/login called | email=%s", payload.email)
    try:
        return await container.auth_service.login(payload)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

