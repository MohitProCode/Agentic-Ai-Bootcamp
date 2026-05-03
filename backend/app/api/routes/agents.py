from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict
import asyncio
import json
from app.services.agent_orchestrator import (
    run_profiling_workflow,
    run_mentor_workflow,
    run_content_workflow,
    activity_tracker
)

router = APIRouter(prefix="/agents", tags=["agents"])

class ProfileRequest(BaseModel):
    user_id: str
    target_role: str
    experience_level: str
    weekly_hours: int
    learning_style: str
    focus_topics: List[str]
    goals: str

class MentorRequest(BaseModel):
    user_id: str
    question: str
    context: Dict

class ContentRequest(BaseModel):
    topic: str
    skill_level: str
    learning_style: str

@router.post("/profile")
async def create_profile(req: ProfileRequest):
    """Run Learning Profiler agent to analyze learner"""
    activity_tracker.clear()
    
    user_input = {
        "target_role": req.target_role,
        "experience_level": req.experience_level,
        "weekly_hours": req.weekly_hours,
        "learning_style": req.learning_style,
        "focus_topics": req.focus_topics,
        "goals": req.goals
    }
    
    profile = await run_profiling_workflow(user_input)
    
    return {
        "profile": profile,
        "agent_activities": activity_tracker.get_activities()
    }

@router.post("/mentor")
async def ask_mentor(req: MentorRequest):
    """Get personalized guidance from AI Mentor agent"""
    activity_tracker.clear()
    
    response = await run_mentor_workflow(req.question, req.context)
    
    return {
        "response": response,
        "agent_activities": activity_tracker.get_activities()
    }

@router.post("/curate")
async def curate_content(req: ContentRequest):
    """Get curated resources from Content Curator agent"""
    activity_tracker.clear()
    
    resources = await run_content_workflow(
        topic=req.topic,
        skill_level=req.skill_level,
        learning_style=req.learning_style
    )
    
    return {
        "resources": resources,
        "agent_activities": activity_tracker.get_activities()
    }

@router.get("/activities")
async def get_activities():
    """Get recent agent activities"""
    return {
        "activities": activity_tracker.get_activities()
    }

# WebSocket for real-time agent activity updates
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    activity_tracker.add_websocket(websocket)
    
    try:
        # Send current activities on connect
        await websocket.send_json({
            "type": "initial",
            "activities": activity_tracker.get_activities()
        })
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        activity_tracker.remove_websocket(websocket)
    except Exception as e:
        activity_tracker.remove_websocket(websocket)
        print(f"WebSocket error: {e}")
