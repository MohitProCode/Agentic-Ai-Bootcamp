# 🚀 Quick Start Guide

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Make Sure Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Pull Llama3 model (if not already done)
ollama pull llama3
```

### 3. Start Backend Server

```bash
# From backend directory
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`

### 4. Start Frontend (New Terminal)

```bash
cd lumina-ai
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🎯 Test the System

1. **Sign Up**: Go to `http://localhost:5173/signup`
   - Fill in your details
   - Select target role (e.g., "Software Engineer")
   - Choose experience level
   - Select focus topics (e.g., "React & Next.js", "TypeScript")

2. **View AI Agents**: Navigate to "🤖 AI Agents" in the menu
   - See all 6 specialized agents
   - Test individual agents
   - View system architecture

3. **Take Adaptive Quiz**: Go to "Adaptive Quiz"
   - Click "Start Quiz" on any topic
   - Watch agents generate questions in real-time
   - See agent activity feed showing collaboration
   - Answer questions with confidence levels

4. **View Gap Analysis**: After completing quiz
   - Multiple agents analyze your performance
   - See knowledge gaps identified
   - Get personalized remediation plan

## 🎨 Key Features to Demo

### Multi-Agent Collaboration
- **Learning Profiler**: Analyzes your background
- **Quiz Master**: Generates adaptive questions
- **Progress Analyst**: Identifies knowledge gaps
- **Curriculum Architect**: Creates learning plans
- **Content Curator**: Finds resources
- **AI Mentor**: Provides guidance

### Real-Time Agent Activity
- Live feed showing which agents are working
- Status indicators (working/completed/error)
- Animated activity cards
- Agent collaboration visualization

### Adaptive Learning
- Questions adjust difficulty based on performance
- Confidence-based answering
- Personalized feedback
- Gap-focused remediation

## 🔧 Troubleshooting

### Ollama Connection Issues
```bash
# Restart Ollama
pkill ollama
ollama serve
```

### Backend Import Errors
```bash
pip install --upgrade crewai crewai-tools langchain langchain-community langchain-ollama
```

### Frontend Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 API Endpoints

- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/quiz/start` - Start adaptive quiz (uses Quiz Master agent)
- `POST /api/v1/plan/generate` - Generate learning plan (uses 3 agents)
- `POST /api/v1/agents/profile` - Create learner profile
- `POST /api/v1/agents/mentor` - Ask AI Mentor
- `POST /api/v1/agents/curate` - Get curated resources

## 🎬 Demo Script

1. **Show Agent Dashboard** (2 min)
   - Navigate to AI Agents page
   - Explain each agent's role
   - Show architecture diagram

2. **Live Agent Test** (3 min)
   - Select "AI Mentor" agent
   - Ask: "Explain React hooks"
   - Show agent activity feed
   - Display response

3. **Adaptive Quiz** (5 min)
   - Start a quiz on "React & Next.js"
   - Show Quiz Master generating questions
   - Answer 2-3 questions
   - Complete quiz
   - Show multi-agent gap analysis

4. **Results & Insights** (2 min)
   - View quiz results
   - Show identified weak concepts
   - Display personalized learning plan
   - Highlight agent collaboration

## 🏆 Winning Points

✅ **True Multi-Agent System** - Not just a chatbot, 6 specialized agents collaborating
✅ **Real-Time Visualization** - See agents "thinking" and working together
✅ **Local LLM** - Runs on Ollama (Llama3), no API costs
✅ **Practical Application** - Solves real education personalization problem
✅ **Scalable Architecture** - Easy to add more specialized agents
✅ **Beautiful UI** - Modern, animated, professional design

---

**Built with CrewAI + LangChain + Ollama + FastAPI + React**
