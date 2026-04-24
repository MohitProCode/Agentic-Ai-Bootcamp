import asyncio

from app.core.errors import SessionNotFoundError
from app.models import QuizSession


class InMemoryQuizRepository:
    def __init__(self) -> None:
        self._sessions: dict[str, QuizSession] = {}
        self._lock = asyncio.Lock()

    async def create(self, session: QuizSession) -> QuizSession:
        async with self._lock:
            self._sessions[session.session_id] = session.model_copy(deep=True)
            return self._sessions[session.session_id].model_copy(deep=True)

    async def get(self, session_id: str) -> QuizSession:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                raise SessionNotFoundError(f"Session '{session_id}' not found.")
            return session.model_copy(deep=True)

    async def update(self, session: QuizSession) -> QuizSession:
        async with self._lock:
            if session.session_id not in self._sessions:
                raise SessionNotFoundError(f"Session '{session.session_id}' not found.")
            self._sessions[session.session_id] = session.model_copy(deep=True)
            return self._sessions[session.session_id].model_copy(deep=True)

    async def list_by_user(self, user_id: str) -> list[QuizSession]:
        async with self._lock:
            sessions = [session.model_copy(deep=True) for session in self._sessions.values() if session.user_id == user_id]
            sessions.sort(key=lambda session: session.updated_at, reverse=True)
            return sessions
