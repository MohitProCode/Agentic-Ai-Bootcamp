# Personalized Learning Path (Lumina UI + Local LLM Backend)

Production-style adaptive learning platform with a dark multi-screen UI and a FastAPI backend powered by local Ollama models.

## Product Flow

1. Login / Signup
2. Onboarding Goals (Step 1)
3. Diagnostic Quiz (Step 2)
4. Review + Generate Plan (Step 3)
5. Dashboard, Resources, Progress Tracking, Settings

Core AI pipeline:

`Quiz -> Evaluation -> Gap Analysis -> Resource Retrieval -> Plan Generation -> Plan Validation -> Auto-Fix`

## Tech Stack

- Frontend: React + Tailwind + Vite
- Backend: FastAPI + Pydantic
- LLM orchestration: LangChain (`ChatOllama`) with structured JSON parsing and retries
- Agent architecture: CrewAI agent definitions (Diagnoser, Resource, Planner, Reviewer)
- Runtime model: Local Ollama

## Backend Endpoints

### Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`

### Onboarding
- `POST /api/v1/onboarding/goals`
- `GET /api/v1/onboarding/goals/{user_id}`

### Quiz + Plan
- `POST /api/v1/quiz/start`
- `POST /api/v1/quiz/answer`
- `GET /api/v1/quiz/result?session_id=<id>`
- `POST /api/v1/plan/generate`
- `GET /api/v1/plan/{user_id}`

### Portal APIs (for dashboard screens)
- `GET /api/v1/dashboard/{user_id}`
- `GET /api/v1/resources/{user_id}?search=&topic=&level=&format=&duration=`
- `GET /api/v1/progress/{user_id}`
- `GET /api/v1/settings/{user_id}`
- `PUT /api/v1/settings/{user_id}`

## Demo Account

- Email: `alex.j@example.com`
- Password: `password123`
- User ID: `learner_001`

## Setup

### Prerequisites

1. Python 3.10+
2. Node.js 18+
3. Ollama installed
4. Pull a local model, for example:
   - `ollama pull llama3.1:8b`

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Notes

- All LLM calls are routed through LangChain structured output parsing.
- Temperature is constrained to deterministic behavior (`<= 0.3`).
- Fallback logic is included for invalid LLM output and local model failures.
- Data persistence is currently in-memory for rapid local iteration.
- For faster UX on local machines:
  - `QUIZ_LLM_GENERATION_ENABLED=false` keeps diagnostics seed-first (fast, non-repeating).
  - `PLAN_LLM_ENRICHMENT_ENABLED=false` uses deterministic report/plan generation for low latency.
