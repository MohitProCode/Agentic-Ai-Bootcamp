from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.models import AuthResponse, LoginRequest, SignupRequest
from app.repositories.user_repository import InMemoryUserRepository


class AuthService:
    def __init__(self, user_repository: InMemoryUserRepository) -> None:
        self._user_repository = user_repository

    @staticmethod
    def _issue_token(user_id: str) -> str:
        timestamp = int(datetime.now(timezone.utc).timestamp())
        return f"local-{user_id}-{timestamp}-{uuid4().hex[:8]}"

    async def signup(self, payload: SignupRequest) -> AuthResponse:
        user = await self._user_repository.create_user(
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
        )
        return AuthResponse(access_token=self._issue_token(user.user_id), user=user)

    async def login(self, payload: LoginRequest) -> AuthResponse:
        user = await self._user_repository.authenticate(email=payload.email, password=payload.password)
        return AuthResponse(access_token=self._issue_token(user.user_id), user=user)

