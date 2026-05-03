from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/{user_id}")
def get_dashboard(user_id: str):
    return {
        "userId": user_id,
        "completedCourses": 0,
        "inProgressCourses": 0,
        "totalLearningHours": 0,
        "skillsAcquired": 0,
        "recentActivity": []
    }
