class SessionNotFoundError(Exception):
    """Raised when quiz session does not exist."""


class InvalidQuizStateError(Exception):
    """Raised when quiz session transitions are invalid."""


class PlanNotFoundError(Exception):
    """Raised when no generated plan is available for a user."""


class UserNotFoundError(Exception):
    """Raised when user does not exist."""


class AuthenticationError(Exception):
    """Raised when credentials are invalid."""


class UserAlreadyExistsError(Exception):
    """Raised when creating user with duplicate email."""
