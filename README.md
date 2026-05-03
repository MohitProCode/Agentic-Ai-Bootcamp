# 🤖 Agentic AI Learning Platform

An adaptive learning platform powered by **CrewAI** multi-agent system using **Ollama (Llama3)** for personalized education.

## 🎯 Features

### Multi-Agent AI System
- **Learning Profiler Agent**: Analyzes learner background and creates detailed profiles
- **Curriculum Architect Agent**: Designs personalized learning paths
- **Quiz Master Agent**: Generates adaptive assessments in real-time
- **Content Curator Agent**: Finds and recommends tailored resources
- **Progress Analyst Agent**: Tracks patterns and predicts outcomes
- **AI Mentor Agent**: Provides personalized guidance and motivation

### Key Capabilities
- ✅ Real-time adaptive quiz generation
- ✅ Multi-agent collaboration visualization
- ✅ Knowledge gap analysis
- ✅ Personalized learning paths
- ✅ Progress tracking and analytics
- ✅ AI-powered mentoring

## 🚀 Setup Instructions

### Prerequisites
1. **Python 3.10+**
2. **Node.js 18+**
3. **Ollama** installed and running

### Step 1: Install Ollama & Pull Llama3

```bash
# Install Ollama from https://ollama.ai

# Pull Llama3 model
ollama pull llama3

# Verify it's running
ollama list
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

### Step 3: Frontend Setup

```bash
cd lumina-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🎮 Usage

### 1. Sign Up
- Enter your details and learning preferences
- Select target role, experience level, and focus topics
- AI agents will analyze your profile

### 2. Take Adaptive Quizzes
- Navigate to "Adaptive Quizzes"
- Select a topic quiz
- Watch agents generate questions in real-time
- Answer with confidence levels
- Get instant feedback

### 3. View Agent Activity
- See real-time agent collaboration
- Track which agents are working
- View completed tasks

### 4. Get Personalized Learning Path
- After quiz completion, agents analyze gaps
- Curriculum Architect designs remediation plan
- Content Curator finds targeted resources
- Progress Analyst tracks improvement

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - Agent Activity Visualization         │
│  - Real-time Updates                    │
│  - Adaptive Quiz Interface              │
└──────────────┬──────────────────────────┘
               │
               │ REST API
               │
┌──────────────▼──────────────────────────┐
│       Backend (FastAPI + CrewAI)        │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Agent Orchestrator Service       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐│
│  │  6 Specialized AI Agents (CrewAI)   ││
│  │  - Learning Profiler                ││
│  │  - Curriculum Architect             ││
│  │  - Quiz Master                      ││
│  │  - Content Curator                  ││
│  │  - Progress Analyst                 ││
│  │  - AI Mentor                        ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │
               │ LangChain
               │
┌──────────────▼──────────────────────────┐
│      Ollama (Llama3 - Local LLM)        │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── agents/
│   │   └── learning_agents.py      # 6 CrewAI agents
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── quiz.py             # Agent-powered quizzes
│   │       ├── plan.py             # Gap analysis
│   │       └── agents.py           # Agent interactions
│   ├── services/
│   │   └── agent_orchestrator.py   # Workflow management
│   └── core/
│       └── config.py
└── requirements.txt

lumina-ai/
├── src/
│   ├── components/
│   │   └── AgentActivityFeed.jsx   # Real-time agent UI
│   ├── pages/
│   │   └── app/
│   │       └── AdaptiveQuizPage.jsx
│   └── api/
│       └── luminaApi.js
└── package.json
```

## 🎨 Agent Activity Visualization

The platform shows real-time agent collaboration:

```
🤖 Learning Profiler: Analyzing learner background...
🤖 Quiz Master: Generating 8 adaptive questions
🤖 Content Curator: Finding resources for React
🤖 Progress Analyst: Analyzing learning patterns
```

Each agent has:
- Unique icon and color
- Status indicators (working/completed/error)
- Animated activity feed
- Real-time updates

## 🔧 Configuration

Edit `backend/.env`:

```env
# Ollama Configuration
OLLAMA_MODEL=llama3:latest
OLLAMA_TEMPERATURE=0.2

# Quiz Settings
QUIZ_DEFAULT_QUESTION_COUNT=8
QUIZ_TARGET_TIME_SECONDS=45

# Learning Plan
LEARNING_PLAN_DEFAULT_WEEKS=4
```

## 🚨 Troubleshooting

### Ollama Not Running
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve
```

### Agent Timeout
- Increase `LLM_REQUEST_TIMEOUT_SECONDS` in `.env`
- Use smaller question counts for faster generation

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 🎯 Demo Flow

1. **Sign up** with learning goals
2. **Start quiz** - Watch Quiz Master agent generate questions
3. **Answer questions** with confidence levels
4. **Complete quiz** - See multi-agent gap analysis
5. **View results** - Get personalized remediation plan
6. **Track progress** - Monitor skill improvement

## 🏆 Hackathon Highlights

- **Innovation**: True multi-agent collaboration, not just a chatbot
- **Technical Depth**: CrewAI + LangChain + RAG + Real-time adaptation
- **Visual Impact**: Live agent activity feed shows AI "thinking"
- **Practical Value**: Solves real education personalization problem
- **Scalability**: Agent framework can add infinite specializations

## 📊 Performance

- Quiz generation: ~10-15 seconds (depends on Ollama)
- Gap analysis: ~20-30 seconds (3 agents collaborating)
- Real-time updates: <100ms latency

## 🔮 Future Enhancements

- [ ] WebSocket for live agent streaming
- [ ] Vector database for resource recommendations
- [ ] Spaced repetition system
- [ ] Peer learning agent
- [ ] Career pathfinding agent
- [ ] Multi-modal content (code execution, diagrams)

## 📝 License

MIT License - Built for hackathon demonstration

## 🤝 Contributing

This is a hackathon project. Feel free to fork and enhance!

---

**Built with ❤️ using CrewAI, LangChain, Ollama, FastAPI, and React**
