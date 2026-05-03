from fastapi import APIRouter
from app.api.routes.quiz import quiz_sessions
from collections import defaultdict

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/{user_id}")
async def get_progress(user_id: str):
    # Calculate real progress from quiz sessions
    user_sessions = {sid: s for sid, s in quiz_sessions.items() if s.get("user_id") == user_id}
    
    total_quizzes = len(user_sessions)
    total_correct = sum(s.get("correct_count", 0) for s in user_sessions.values())
    total_answered = sum(len(s.get("answers", [])) for s in user_sessions.values())
    
    quiz_average = round((total_correct / total_answered * 100) if total_answered > 0 else 0)
    
    # Topic breakdown
    topics = {}
    for session in user_sessions.values():
        topic = session.get("topic", "Unknown")
        if topic not in topics:
            topics[topic] = {"quizzes": 0, "correct": 0, "total": 0}
        topics[topic]["quizzes"] += 1
        topics[topic]["correct"] += session.get("correct_count", 0)
        topics[topic]["total"] += len(session.get("answers", []))
    
    topic_list = [
        {
            "name": topic,
            "progress": round((data["correct"] / data["total"] * 100) if data["total"] > 0 else 0),
            "quizzes_taken": data["quizzes"]
        }
        for topic, data in topics.items()
    ]
    
    # Calculate skill mastery (strengths) from correct answers
    concept_performance = defaultdict(lambda: {"correct": 0, "total": 0})
    
    for session in user_sessions.values():
        questions = session.get("questions", [])
        answers = session.get("answers", [])
        
        for i, answer in enumerate(answers):
            if i < len(questions):
                concept = questions[i].get("concept_tested", questions[i].get("topic", "General"))
                concept_performance[concept]["total"] += 1
                if answer.get("correct", False):
                    concept_performance[concept]["correct"] += 1
    
    # Build skill mastery list (strengths)
    skill_mastery = [
        {
            "skill": concept,
            "score": round((data["correct"] / data["total"] * 100) if data["total"] > 0 else 0)
        }
        for concept, data in concept_performance.items()
    ]
    skill_mastery.sort(key=lambda x: x["score"], reverse=True)
    
    # Build weekly trend data
    weekly_data = []
    if total_quizzes > 0:
        sessions_list = list(user_sessions.values())
        for i in range(min(4, total_quizzes)):
            session = sessions_list[-(i+1)] if i < len(sessions_list) else sessions_list[0]
            correct = session.get("correct_count", 0)
            total = len(session.get("answers", []))
            score = round((correct / total * 100) if total > 0 else 0)
            weekly_data.append({
                "week": f"Quiz {total_quizzes - i}",
                "score": score
            })
        weekly_data.reverse()
    
    # Build heatmap (simple pattern)
    heatmap = []
    for week in range(4):
        week_data = []
        for day in range(7):
            intensity = min(5, total_quizzes) if (week * 7 + day) < (total_quizzes * 2) else 0
            week_data.append(intensity)
        heatmap.append(week_data)
    
    return {
        "user_id": user_id,
        "overall_progress": min(100, total_quizzes * 10),
        "topics": topic_list,
        "streak_days": min(total_quizzes, 7),
        "total_quizzes": total_quizzes,
        "quiz_average": quiz_average,
        "total_correct": total_correct,
        "total_answered": total_answered,
        "plan_completion": min(100, total_quizzes * 15),
        "time_spent_hours": total_quizzes * 0.25,
        "weekly_goals_completed": min(total_quizzes, 3),
        "weekly_goals_target": 3,
        "skill_mastery": skill_mastery[:8],
        "trend_points": weekly_data,
        "heatmap": [
            {"week": f"W{i+1}", "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][j], "intensity": heatmap[i][j]}
            for i in range(4) for j in range(7)
        ]
    }
