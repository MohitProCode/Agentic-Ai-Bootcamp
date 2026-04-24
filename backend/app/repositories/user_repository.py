from __future__ import annotations

import asyncio
from uuid import uuid4

from app.core.errors import AuthenticationError, UserAlreadyExistsError, UserNotFoundError
from app.models import (
    AppPreferences,
    AuthUser,
    GoalPreferences,
    ProfileSettings,
    SettingsResponse,
    SettingsUpdateRequest,
)


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[str, dict[str, object]] = {}
        self._email_to_user_id: dict[str, str] = {}
        self._lock = asyncio.Lock()
        self._seed_demo_user()

    @staticmethod
    def _name_parts(full_name: str) -> tuple[str, str]:
        chunks = [part for part in full_name.strip().split(" ") if part]
        if not chunks:
            return "Learner", "User"
        if len(chunks) == 1:
            return chunks[0], "User"
        return chunks[0], " ".join(chunks[1:])

    def _seed_demo_user(self) -> None:
        demo_user = AuthUser(
            user_id="learner_001",
            full_name="Alex Johnson",
            email="alex.j@example.com",
            avatar_url="https://api.dicebear.com/8.x/adventurer/svg?seed=alex",
            role="learner",
        )
        profile = ProfileSettings(
            first_name="Alex",
            last_name="Johnson",
            email=demo_user.email,
            bio="Senior developer and educator focused on React and modern web architecture.",
            avatar_url=demo_user.avatar_url,
        )
        prefs = AppPreferences(
            language="English",
            timezone="Asia/Kolkata",
            notifications_enabled=True,
            weekly_report_enabled=True,
            appearance="Dark",
        )
        self._users[demo_user.user_id] = {
            "user": demo_user,
            "password": "password123",
            "profile": profile,
            "preferences": prefs,
            "goals": GoalPreferences(
                target_role="Software Engineer",
                focus_skills=["React & Next.js", "TypeScript", "Node.js", "Python", "System Design"],
                weekly_hours=15,
                target_timeframe="6 Months",
                learning_style="Hands-on",
                content_language="English",
            ),
            "saved_resource_ids": {"py-docs-tutorial", "ml-crash-course"},
        }
        self._email_to_user_id[demo_user.email.lower()] = demo_user.user_id

    async def create_user(self, *, full_name: str, email: str, password: str) -> AuthUser:
        normalized_email = email.strip().lower()
        async with self._lock:
            if normalized_email in self._email_to_user_id:
                raise UserAlreadyExistsError(f"User already exists for email '{email}'.")

            user = AuthUser(
                user_id=f"user_{uuid4().hex[:10]}",
                full_name=full_name.strip(),
                email=normalized_email,
                avatar_url=f"https://api.dicebear.com/8.x/adventurer/svg?seed={uuid4().hex[:6]}",
                role="learner",
            )
            first_name, last_name = self._name_parts(full_name)
            profile = ProfileSettings(
                first_name=first_name,
                last_name=last_name,
                email=user.email,
                bio="Learner focused on practical AI engineering skills.",
                avatar_url=user.avatar_url,
            )
            prefs = AppPreferences()

            self._users[user.user_id] = {
                "user": user,
                "password": password,
                "profile": profile,
                "preferences": prefs,
                "goals": None,
                "saved_resource_ids": set(),
            }
            self._email_to_user_id[normalized_email] = user.user_id
            return user.model_copy(deep=True)

    async def authenticate(self, *, email: str, password: str) -> AuthUser:
        normalized_email = email.strip().lower()
        async with self._lock:
            user_id = self._email_to_user_id.get(normalized_email)
            if user_id is None:
                raise AuthenticationError("Invalid email or password.")
            record = self._users[user_id]
            if record["password"] != password:
                raise AuthenticationError("Invalid email or password.")
            return record["user"].model_copy(deep=True)

    async def get_user(self, user_id: str) -> AuthUser:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")
            return record["user"].model_copy(deep=True)

    async def save_goals(self, user_id: str, preferences: GoalPreferences) -> GoalPreferences:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")
            record["goals"] = preferences.model_copy(deep=True)
            return record["goals"].model_copy(deep=True)

    async def get_goals(self, user_id: str) -> GoalPreferences | None:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")
            goals = record["goals"]
            if goals is None:
                return None
            return goals.model_copy(deep=True)

    async def get_settings(self, user_id: str) -> SettingsResponse:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")
            return SettingsResponse(
                user_id=user_id,
                profile=record["profile"].model_copy(deep=True),
                preferences=record["preferences"].model_copy(deep=True),
            )

    async def update_settings(self, user_id: str, payload: SettingsUpdateRequest) -> SettingsResponse:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")

            profile = record["profile"].model_copy(deep=True)
            preferences = record["preferences"].model_copy(deep=True)
            user = record["user"].model_copy(deep=True)

            if payload.profile is not None:
                updates = payload.profile.model_dump(exclude_none=True)
                for key, value in updates.items():
                    setattr(profile, key, value)
                if "email" in updates:
                    old_email = user.email.lower()
                    new_email = profile.email.lower()
                    if new_email != old_email and new_email in self._email_to_user_id:
                        raise UserAlreadyExistsError(f"User already exists for email '{profile.email}'.")
                    self._email_to_user_id.pop(old_email, None)
                    self._email_to_user_id[new_email] = user_id
                    user.email = profile.email
                if "first_name" in updates or "last_name" in updates:
                    user.full_name = f"{profile.first_name} {profile.last_name}".strip()
                if "avatar_url" in updates and profile.avatar_url:
                    user.avatar_url = profile.avatar_url

            if payload.preferences is not None:
                updates = payload.preferences.model_dump(exclude_none=True)
                for key, value in updates.items():
                    setattr(preferences, key, value)

            record["profile"] = profile
            record["preferences"] = preferences
            record["user"] = user
            return SettingsResponse(user_id=user_id, profile=profile, preferences=preferences)

    async def get_saved_resource_ids(self, user_id: str) -> set[str]:
        async with self._lock:
            record = self._users.get(user_id)
            if record is None:
                raise UserNotFoundError(f"User '{user_id}' not found.")
            return set(record["saved_resource_ids"])

