from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
from datetime import datetime
from app.services.agent_orchestrator import (
    run_gap_analysis_workflow,
    activity_tracker
)
from app.api.routes.quiz import quiz_sessions

router = APIRouter(prefix="/plan", tags=["plan"])

class GeneratePlanRequest(BaseModel):
    user_id: str
    topic: str
    weeks: int
    quiz_session_id: str

# Store all generated plans with unique IDs
generated_plans = []

@router.post("/generate")
async def generate_plan(req: GeneratePlanRequest):
    activity_tracker.clear()
    
    # Get quiz session data
    quiz_session = quiz_sessions.get(req.quiz_session_id, {})
    
    # Run multi-agent gap analysis workflow
    result = await run_gap_analysis_workflow(
        quiz_session=quiz_session,
        topic=req.topic
    )
    
    # Store the plan with unique ID
    plan_entry = {
        "id": f"{req.user_id}_{req.quiz_session_id}_{datetime.now().timestamp()}",
        "user_id": req.user_id,
        "topic": req.topic,
        "quiz_session_id": req.quiz_session_id,
        "result": result,
        "generated_at": datetime.now().isoformat()
    }
    generated_plans.append(plan_entry)
    
    # Add agent activities to response
    result["agent_activities"] = activity_tracker.get_activities()
    
    return result

@router.get("/report/{user_id}")
async def get_plan_report(user_id: str):
    # Get all plans for this user
    user_plans = [p for p in generated_plans if p["user_id"] == user_id]
    
    if not user_plans:
        return {
            "user_id": user_id,
            "message": "No learning plan generated yet. Complete a quiz to generate your personalized plan.",
            "plans": []
        }
    
    # Sort by generated_at descending
    user_plans.sort(key=lambda p: p.get("generated_at", ""), reverse=True)
    
    # Return the most recent plan
    latest_plan = user_plans[0]
    
    return {
        "user_id": user_id,
        "topic": latest_plan["topic"],
        "generated_at": latest_plan["generated_at"],
        "gap_report": latest_plan["result"].get("gap_report", {}),
        "plan": latest_plan["result"].get("plan", {}),
        "validation": latest_plan["result"].get("validation", {}),
        "all_plans": [
            {
                "id": p["id"],
                "topic": p["topic"],
                "generated_at": p["generated_at"],
                "quiz_session_id": p["quiz_session_id"]
            }
            for p in user_plans
        ]
    }

@router.get("/all/{user_id}")
async def get_all_plans(user_id: str):
    # Get all plans for this user
    user_plans = [p for p in generated_plans if p["user_id"] == user_id]
    
    # Sort by generated_at descending
    user_plans.sort(key=lambda p: p.get("generated_at", ""), reverse=True)
    
    return {
        "user_id": user_id,
        "total": len(user_plans),
        "plans": [
            {
                "id": p["id"],
                "topic": p["topic"],
                "generated_at": p["generated_at"],
                "quiz_session_id": p["quiz_session_id"],
                "gap_report": p["result"].get("gap_report", {}),
                "plan": p["result"].get("plan", {}),
            }
            for p in user_plans
        ]
    }
