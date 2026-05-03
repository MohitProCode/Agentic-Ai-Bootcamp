from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])

class UpdateSettingsRequest(BaseModel):
    notifications: bool = True
    email_updates: bool = True
    difficulty_preference: str = "intermediate"

@router.get("/{user_id}")
async def get_settings(user_id: str):
    return {
        "user_id": user_id,
        "notifications": True,
        "email_updates": True,
        "difficulty_preference": "intermediate",
        "theme": "dark"
    }

@router.put("/{user_id}")
async def update_settings(user_id: str, settings: UpdateSettingsRequest):
    return {
        "user_id": user_id,
        "message": "Settings updated successfully",
        **settings.model_dump()
    }
