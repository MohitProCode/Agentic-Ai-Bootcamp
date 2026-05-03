from fastapi import APIRouter
from app.api.routes.quiz import quiz_sessions

router = APIRouter(prefix="/resources", tags=["resources"])

# Resource database
RESOURCE_DB = {
    "Python": [
        {"resource_id": "py1", "title": "Python Official Tutorial", "resource_type": "article", "duration_minutes": 120, "level": "beginner", "url": "https://docs.python.org/3/tutorial/", "description": "Official Python tutorial covering all fundamentals", "tags": ["Python", "basics"], "match_score": 95},
        {"resource_id": "py2", "title": "Real Python - Python Basics", "resource_type": "video", "duration_minutes": 45, "level": "beginner", "url": "https://realpython.com/", "description": "Video tutorials for Python beginners", "tags": ["Python", "video"], "match_score": 92},
        {"resource_id": "py3", "title": "Python Data Structures Deep Dive", "resource_type": "interactive", "duration_minutes": 180, "level": "intermediate", "url": "https://www.coursera.org/", "description": "Interactive course on Python data structures", "tags": ["Python", "data structures"], "match_score": 88},
        {"resource_id": "py4", "title": "Advanced Python Patterns", "resource_type": "article", "duration_minutes": 60, "level": "advanced", "url": "https://python-patterns.guide/", "description": "Design patterns and best practices in Python", "tags": ["Python", "advanced"], "match_score": 85},
    ],
    "React": [
        {"resource_id": "r1", "title": "React Official Documentation", "resource_type": "article", "duration_minutes": 180, "level": "beginner", "url": "https://react.dev/", "description": "Official React documentation and tutorials", "tags": ["React", "basics"], "match_score": 96},
        {"resource_id": "r2", "title": "React Hooks Explained", "resource_type": "video", "duration_minutes": 30, "level": "intermediate", "url": "https://www.youtube.com/watch?v=O6P86uwfdR0", "description": "Complete guide to React Hooks", "tags": ["React", "hooks"], "match_score": 93},
        {"resource_id": "r3", "title": "Building React Apps", "resource_type": "interactive", "duration_minutes": 300, "level": "intermediate", "url": "https://www.freecodecamp.org/", "description": "Build real-world React applications", "tags": ["React", "projects"], "match_score": 90},
        {"resource_id": "r4", "title": "Advanced React Patterns", "resource_type": "article", "duration_minutes": 120, "level": "advanced", "url": "https://kentcdodds.com/", "description": "Advanced patterns and performance optimization", "tags": ["React", "advanced"], "match_score": 87},
    ],
    "JavaScript": [
        {"resource_id": "js1", "title": "JavaScript Fundamentals", "resource_type": "video", "duration_minutes": 60, "level": "beginner", "url": "https://javascript.info/", "description": "Modern JavaScript tutorial from basics", "tags": ["JavaScript", "basics"], "match_score": 94},
        {"resource_id": "js2", "title": "ES6+ Features Guide", "resource_type": "article", "duration_minutes": 45, "level": "intermediate", "url": "https://es6-features.org/", "description": "Complete guide to modern JavaScript features", "tags": ["JavaScript", "ES6"], "match_score": 91},
    ]
}

@router.get("/{user_id}")
async def get_resources(user_id: str, topic: str = "All", level: str = "All", format: str = "All", duration: str = "All"):
    user_sessions = {sid: s for sid, s in quiz_sessions.items() if s.get("user_id") == user_id}
    
    user_topics = set()
    for session in user_sessions.values():
        session_topic = session.get("topic", "")
        user_topics.add(session_topic)
        for db_topic in RESOURCE_DB.keys():
            if db_topic.lower() in session_topic.lower():
                user_topics.add(db_topic)
    
    if not user_topics:
        user_topics = set(RESOURCE_DB.keys())
    
    all_resources = []
    recommended = []
    
    for db_topic in user_topics:
        if db_topic in RESOURCE_DB:
            for resource in RESOURCE_DB[db_topic]:
                if topic != "All" and db_topic.lower() not in topic.lower():
                    continue
                if level != "All" and resource["level"] != level.lower():
                    continue
                if format != "All" and "Format:" in format:
                    format_type = format.replace("Format: ", "").replace("Format:", "").strip().lower()
                    if format_type != "all" and resource["resource_type"] != format_type:
                        continue
                
                all_resources.append(resource)
                if resource["match_score"] >= 90:
                    recommended.append(resource)
    
    recommended = sorted(recommended, key=lambda x: x["match_score"], reverse=True)[:6]
    
    topics_set = set()
    for resource in all_resources:
        for tag in resource.get("tags", []):
            topics_set.add(tag)
    
    # Calculate analytics
    type_counts = {}
    for resource in all_resources:
        res_type = resource.get("resource_type", "other")
        type_counts[res_type] = type_counts.get(res_type, 0) + 1
    
    analytics = [
        {"label": res_type.capitalize(), "count": count}
        for res_type, count in type_counts.items()
    ]
    
    return {
        "user_id": user_id,
        "filters": {"topic": topic, "level": level, "format": format, "duration": duration},
        "resources": all_resources,
        "recommended": recommended,
        "topics": list(topics_set),
        "saved_count": 0,
        "analytics": analytics
    }
