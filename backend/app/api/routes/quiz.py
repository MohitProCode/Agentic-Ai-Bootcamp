from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, ValidationError, field_validator
from typing import List, Optional, Union
import asyncio
import json
from app.services.agent_orchestrator import (
    run_quiz_workflow,
    run_gap_analysis_workflow,
    activity_tracker
)

router = APIRouter(prefix="/quiz", tags=["quiz"])

# Store active quiz sessions
quiz_sessions = {}

class StartQuizRequest(BaseModel):
    user_id: str
    topic: str
    target_concepts: List[str]
    num_questions: int
    difficulty: str = "intermediate"

class SubmitAnswerRequest(BaseModel):
    model_config = ConfigDict(extra='allow')
    
    session_id: str
    question_id: Union[str, int]
    selected_option_id: Union[str, int]
    confidence: float
    time_spent_seconds: int
    
    @field_validator('question_id', 'selected_option_id', mode='before')
    @classmethod
    def convert_to_string(cls, v):
        return str(v)

@router.post("/start")
async def start_quiz(req: StartQuizRequest):
    activity_tracker.clear()
    
    print(f"\n=== Starting Quiz ===")
    print(f"Topic: {req.topic}")
    print(f"Difficulty: {req.difficulty}")
    print(f"Num Questions: {req.num_questions}")
    print(f"=====================\n")
    
    # Generate questions using Quiz Master agent
    questions = await run_quiz_workflow(
        topic=req.topic,
        difficulty=req.difficulty,
        num_questions=req.num_questions
    )
    
    # Create unique session ID with random component
    import random
    session_id = f"session_{abs(hash(f'{req.user_id}_{req.topic}_{random.random()}')) % 10**12}"
    
    print(f"Generated {len(questions)} questions for topic: {req.topic}")
    if questions:
        print(f"First question: {questions[0].get('prompt', 'N/A')[:80]}...")
        print(f"Question topic field: {questions[0].get('topic', 'N/A')}")
    
    # Store session
    quiz_sessions[session_id] = {
        "user_id": req.user_id,
        "topic": req.topic,
        "questions": questions,
        "current_index": 0,
        "answers": [],
        "correct_count": 0
    }
    
    return {
        "session_id": session_id,
        "question": questions[0] if questions else None,
        "question_number": 1,
        "total_questions": len(questions),
        "agent_activities": activity_tracker.get_activities()
    }

@router.post("/answer")
async def submit_answer(request: Request):
    # Get raw body to debug
    try:
        body = await request.json()
        print(f"\n=== Raw request body ===")
        print(json.dumps(body, indent=2))
        print(f"========================\n")
        
        # Try to parse manually
        req_data = SubmitAnswerRequest(**body)
        print(f"Parsed successfully: {req_data.model_dump()}")
        
    except ValidationError as e:
        print(f"\n=== Validation Error ===")
        print(f"Error: {e}")
        print(f"========================\n")
        return {"error": "Validation failed", "details": str(e)}
    except Exception as e:
        print(f"\n=== Other Error ===")
        print(f"Error: {e}")
        print(f"===================\n")
        return {"error": str(e)}
    
    if not req_data.session_id:
        return {"error": "session_id is required"}
    
    session = quiz_sessions.get(req_data.session_id)
    if not session:
        print(f"Session not found: {req_data.session_id}")
        print(f"Available sessions: {list(quiz_sessions.keys())}")
        return {"error": "Session not found"}
    
    current_q = session["questions"][session["current_index"]]
    
    # Debug logging
    print(f"\n=== Answer Validation ===")
    print(f"Selected option ID: {req_data.selected_option_id} (type: {type(req_data.selected_option_id)})")
    print(f"Correct option ID: {current_q.get('correct_option_id')} (type: {type(current_q.get('correct_option_id'))})")
    print(f"Question: {current_q.get('prompt', 'N/A')[:50]}...")
    
    is_correct = str(req_data.selected_option_id) == str(current_q.get("correct_option_id"))
    print(f"Is correct: {is_correct}")
    print(f"========================\n")
    
    # Store answer
    session["answers"].append({
        "question_id": req_data.question_id,
        "selected": req_data.selected_option_id,
        "correct": is_correct,
        "confidence": req_data.confidence,
        "time_spent": req_data.time_spent_seconds
    })
    
    if is_correct:
        session["correct_count"] += 1
    
    session["current_index"] += 1
    is_completed = session["current_index"] >= len(session["questions"])
    
    next_question = None
    if not is_completed:
        next_question = session["questions"][session["current_index"]]
    
    return {
        "feedback": {
            "is_correct": is_correct,
            "explanation": current_q.get("explanation", "Good effort!")
        },
        "question_number": session["current_index"] + 1,
        "is_completed": is_completed,
        "next_question": next_question
    }

@router.get("/result")
async def get_result(session_id: str):
    session = quiz_sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}
    
    total = len(session["answers"])
    correct = session["correct_count"]
    
    return {
        "session_id": session_id,
        "topic": session["topic"],
        "overall_accuracy": correct / total if total > 0 else 0,
        "correct_answers": correct,
        "answered_questions": total,
        "answers": session["answers"]
    }
