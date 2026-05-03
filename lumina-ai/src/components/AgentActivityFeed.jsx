import { useEffect, useState } from 'react'

const agentIcons = {
  'Learning Profiler': 'fa-user-graduate',
  'Curriculum Architect': 'fa-sitemap',
  'Quiz Master': 'fa-clipboard-question',
  'Content Curator': 'fa-book-open',
  'Progress Analyst': 'fa-chart-line',
  'AI Mentor': 'fa-comments'
}

const agentColors = {
  'Learning Profiler': '#3b82f6',
  'Curriculum Architect': '#8b5cf6',
  'Quiz Master': '#ec4899',
  'Content Curator': '#10b981',
  'Progress Analyst': '#f59e0b',
  'AI Mentor': '#06b6d4'
}

const AgentActivityFeed = ({ activities = [], showTitle = true }) => {
  const [visibleActivities, setVisibleActivities] = useState([])

  useEffect(() => {
    // Animate activities appearing one by one
    if (activities.length > visibleActivities.length) {
      const timer = setTimeout(() => {
        setVisibleActivities(activities.slice(0, visibleActivities.length + 1))
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setVisibleActivities(activities)
    }
  }, [activities, visibleActivities.length])

  if (!activities || activities.length === 0) return null

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-robot text-blue-400" />
          <h3 className="text-sm font-semibold text-white">AI Agent Activity</h3>
        </div>
      )}
      
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {visibleActivities.map((activity, index) => {
          const icon = agentIcons[activity.agent] || 'fa-robot'
          const color = agentColors[activity.agent] || '#60a5fa'
          const isWorking = activity.status === 'working'
          const isCompleted = activity.status === 'completed'
          const isError = activity.status === 'error'

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg animate-slideIn"
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: `1px solid ${color}40`,
                animationDelay: `${index * 100}ms`
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}60`
                }}
              >
                <i className={`fa-solid ${icon} text-sm`} style={{ color }} />
                {isWorking && (
                  <span className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: color }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-3 w-3"
                        style={{ background: color }}
                      />
                    </span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color }}>
                    {activity.agent}
                  </span>
                  {isCompleted && (
                    <i className="fa-solid fa-circle-check text-xs text-emerald-400" />
                  )}
                  {isError && (
                    <i className="fa-solid fa-circle-exclamation text-xs text-red-400" />
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                  {activity.action}
                </p>
                {isWorking && (
                  <div className="mt-2 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentActivityFeed
