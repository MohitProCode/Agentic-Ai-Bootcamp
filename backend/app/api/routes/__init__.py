from app.api.routes.auth import router as auth_router
from app.api.routes.onboarding import router as onboarding_router
from app.api.routes.plan import router as plan_router
from app.api.routes.portal import router as portal_router
from app.api.routes.quiz import router as quiz_router

__all__ = ["auth_router", "onboarding_router", "plan_router", "portal_router", "quiz_router"]
