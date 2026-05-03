import { useState, useEffect, useRef } from 'react'
import { luminaApi } from '../../api/luminaApi'
import AgentActivityFeed from '../../components/AgentActivityFeed'
import useStore from '../../store/useStore'

const agents = [
  {
    name: 'Learning Profiler',
    icon: 'fa-user-graduate',
    color: '#3b82f6',
    role: 'Skill Analyzer',
    description: 'Analyzes learner background, identifies skill gaps, and creates detailed profiles',
    capabilities: ['Profile Analysis', 'Skill Gap Detection', 'Learning Style Assessment']
  },
  {
    name: 'Curriculum Architect',
    icon: 'fa-sitemap',
    color: '#8b5cf6',
    role: 'Path Designer',
    description: 'Designs personalized learning paths with clear milestones and prerequisites',
    capabilities: ['Curriculum Design', 'Milestone Planning', 'Prerequisite Mapping']
  },
  {
    name: 'Quiz Master',
    icon: 'fa-clipboard-question',
    color: '#ec4899',
    role: 'Assessment Specialist',
    description: 'Generates adaptive assessments that adjust difficulty based on performance',
    capabilities: ['Question Generation', 'Difficulty Adaptation', 'Feedback Creation']
  },
  {
    name: 'Content Curator',
    icon: 'fa-book-open',
    color: '#10b981',
    role: 'Resource Specialist',
    description: 'Finds and recommends the best learning resources tailored to individual needs',
    capabilities: ['Resource Discovery', 'Content Matching', 'Quality Filtering']
  },
  {
    name: 'Progress Analyst',
    icon: 'fa-chart-line',
    color: '#f59e0b',
    role: 'Pattern Expert',
    description: 'Tracks learning patterns, predicts outcomes, and identifies areas needing attention',
    capabilities: ['Pattern Recognition', 'Outcome Prediction', 'Performance Analytics']
  },
  {
    name: 'AI Mentor',
    icon: 'fa-comments',
    color: '#06b6d4',
    role: 'Learning Coach',
    description: 'Provides personalized guidance, explanations, and motivation',
    capabilities: ['Concept Explanation', 'Motivational Support', 'Career Guidance']
  }
]

const AgentDashboard = () => {
  const user = useStore((s) => s.user)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const wsRef = useRef(null)

  // WebSocket connection for real-time agent updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/agents/ws')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'initial') {
        setActivities(data.activities || [])
      } else {
        // New activity received
        setActivities((prev) => [...prev, data])
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      ws.close()
    }
  }, [])

  const testAgent = async (agentName) => {
    if (!testInput.trim()) return
    
    setLoading(true)
    setActivities([]) // Clear old activities
    setTestResult(null)

    try {
      let response
      
      if (agentName === 'AI Mentor') {
        response = await luminaApi.askMentor({
          user_id: user?.id || 'demo_user',
          question: testInput,
          context: {
            profile: user?.profile || {},
            current_topic: 'General Learning'
          }
        })
      } else if (agentName === 'Content Curator') {
        response = await luminaApi.curateContent({
          topic: testInput,
          skill_level: user?.profile?.experienceLevel || 'Intermediate',
          learning_style: user?.profile?.learningStyle || 'Mixed'
        })
      } else if (agentName === 'Learning Profiler') {
        response = await luminaApi.createProfile({
          user_id: user?.id || 'demo_user',
          target_role: testInput,
          experience_level: user?.profile?.experienceLevel || 'Intermediate',
          weekly_hours: user?.profile?.weeklyHours || 10,
          learning_style: user?.profile?.learningStyle || 'Mixed',
          focus_topics: user?.profile?.focusTopics || [],
          goals: `Learn ${testInput}`
        })
      }

      setTestResult(response)
      // Activities come via WebSocket in real-time
    } catch (error) {
      setTestResult({ error: error.message || 'Agent test failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto relative z-10 px-6 py-8 overflow-y-auto">
      <section className="space-y-8">
        {/* Header */}
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
              <i className="fa-solid fa-robot text-2xl text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">AI Agent System</h1>
              <p className="text-base" style={{ color: '#94a3b8' }}>
                Meet the 6 specialized AI agents that power your personalized learning experience
              </p>
            </div>
          </div>
        </div>

        {/* Live Agent Activity Panel */}
        {activities.length > 0 && (
          <div className="glass-panel rounded-[16px] border border-blue-500/30 p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <i className="fa-solid fa-broadcast-tower text-blue-400 text-xl" />
                <span className="absolute -top-1 -right-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">Live Agent Activity</h2>
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                Real-time
              </span>
            </div>
            <AgentActivityFeed activities={activities} showTitle={false} />
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <article
              key={agent.name}
              onClick={() => setSelectedAgent(agent)}
              className="glass-panel rounded-[16px] border border-slate-700/50 p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
              style={{
                borderColor: selectedAgent?.name === agent.name ? agent.color : 'rgba(51,65,85,0.5)'
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `${agent.color}20`,
                    border: `1px solid ${agent.color}60`
                  }}
                >
                  <i className={`fa-solid ${agent.icon} text-xl`} style={{ color: agent.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-1">{agent.name}</h3>
                  <p className="text-xs font-medium" style={{ color: agent.color }}>
                    {agent.role}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: '#cbd5e1' }}>
                {agent.description}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{
                        background: `${agent.color}15`,
                        color: agent.color,
                        border: `1px solid ${agent.color}30`
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Agent Tester */}
        {selectedAgent && (
          <div className="glass-panel rounded-[16px] border border-slate-700/50 p-6 md:p-8 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `${selectedAgent.color}20`,
                  border: `1px solid ${selectedAgent.color}60`
                }}
              >
                <i className={`fa-solid ${selectedAgent.icon}`} style={{ color: selectedAgent.color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Test {selectedAgent.name}</h2>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Try out this agent's capabilities
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>
                  {selectedAgent.name === 'AI Mentor' ? 'Ask a question' : 
                   selectedAgent.name === 'Content Curator' ? 'Enter a topic' :
                   selectedAgent.name === 'Learning Profiler' ? 'Enter target role' :
                   'Enter input'}
                </label>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder={
                    selectedAgent.name === 'AI Mentor' ? 'e.g., Explain React hooks' :
                    selectedAgent.name === 'Content Curator' ? 'e.g., TypeScript' :
                    selectedAgent.name === 'Learning Profiler' ? 'e.g., Full Stack Developer' :
                    'Enter test input'
                  }
                  className="w-full input-field rounded-lg py-3 px-4 text-sm"
                />
              </div>

              <button
                onClick={() => testAgent(selectedAgent.name)}
                disabled={loading || !testInput.trim()}
                className="primary-btn rounded-lg px-6 py-3 text-sm font-semibold text-white"
              >
                {loading ? 'Agent Working...' : `Test ${selectedAgent.name}`}
              </button>

              {activities.length > 0 && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                  <AgentActivityFeed activities={activities} />
                </div>
              )}

              {testResult && !loading && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                  <h3 className="text-sm font-semibold text-white mb-3">Agent Response</h3>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Architecture Diagram */}
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">System Architecture</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {agents.map((agent, index) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${agent.color}20`,
                      border: `1px solid ${agent.color}60`
                    }}
                  >
                    <i className={`fa-solid ${agent.icon} text-sm`} style={{ color: agent.color }} />
                  </div>
                  {index < agents.length - 1 && (
                    <i className="fa-solid fa-arrow-right text-slate-600" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <i className="fa-solid fa-arrow-down text-2xl text-slate-600 mb-4" />
              <div className="inline-block px-6 py-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <p className="text-sm font-semibold text-blue-300">CrewAI Orchestrator</p>
              </div>
              <i className="fa-solid fa-arrow-down text-2xl text-slate-600 my-4 block" />
              <div className="inline-block px-6 py-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <p className="text-sm font-semibold text-purple-300">Ollama (Llama3)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AgentDashboard
