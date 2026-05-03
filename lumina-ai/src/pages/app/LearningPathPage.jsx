import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, BookOpen, Target, TrendingUp } from 'lucide-react'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const getLatestReport = (history) =>
  [...(Array.isArray(history) ? history : [])].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )[0] || null

const LearningPathPage = () => {
  const user = useStore((state) => state.user)
  const reportHistory = useStore((state) => state.reportHistory)
  const addReportHistory = useStore((state) => state.addReportHistory)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPlan = async () => {
      if (!user?.id || !user?.isAuthenticated) return
      if (!String(user.id).startsWith('user_')) return
      
      setLoading(true)
      try {
        const report = await luminaApi.getPlanReport(user.id)
        if (report?.plan || report?.gap_report) {
          addReportHistory({
            id: `${user.id}_${report?.generated_at || Date.now()}`,
            createdAt: report?.generated_at || new Date().toISOString(),
            source: 'backend',
            topic: report?.topic || 'Learning Plan',
            summary: report?.gap_report?.summary || '',
            weakConcepts: Array.isArray(report?.gap_report?.weak_concepts)
              ? report.gap_report.weak_concepts.map((item) => ({
                  concept: item.concept,
                  weaknessScore: Number(item.weakness_score || 0),
                  recommendation: item.recommendation || '',
                }))
              : [],
            planWeeks: Array.isArray(report?.plan?.weeks) ? report.plan.weeks.length : 0,
            raw: report,
          })
        }
      } catch (error) {
        console.log('No plan available yet')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [user?.id, user?.isAuthenticated, addReportHistory])

  const latestReport = useMemo(() => getLatestReport(reportHistory), [reportHistory])

  const roadmapWeeks = useMemo(() => {
    const weeks = Array.isArray(latestReport?.raw?.plan?.weeks) ? latestReport.raw.plan.weeks : []
    return weeks.map((week, index) => {
      const weekNumber = Number(week?.week || 0) || index + 1
      const days = (Array.isArray(week?.daily_tasks) ? week.daily_tasks : []).map((day) => ({
        day: day.day,
        tasks: (Array.isArray(day?.daily_tasks) ? day.daily_tasks : []).map((task) => ({
          title: task.title,
          duration: task.duration_minutes || 30,
          concept: task.concept_tag,
          resource: task.resource || null,
        })),
      }))

      return {
        week: weekNumber,
        goal: week?.goal || `Week ${weekNumber} learning sprint`,
        days,
        completed: false,
      }
    })
  }, [latestReport])

  const weaknessCards = useMemo(() => {
    const weakConcepts = Array.isArray(latestReport?.weakConcepts) ? latestReport.weakConcepts : []
    return weakConcepts
      .slice()
      .sort((left, right) => Number(right.weaknessScore || 0) - Number(left.weaknessScore || 0))
      .slice(0, 5)
      .map((item) => ({
        concept: item.concept,
        weakness: Math.round(Number(item.weaknessScore || 0) * 100),
        recommendation: item.recommendation || 'Focus with practice exercises',
      }))
  }, [latestReport])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading your learning path...</p>
        </div>
      </div>
    )
  }

  if (!latestReport) {
    return (
      <div className="p-6">
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-8 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Target size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Your Learning Roadmap</h1>
          <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
            Complete an adaptive quiz to generate your personalized learning roadmap with weekly goals and daily tasks.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/quiz" className="primary-btn px-5 py-2.5 rounded-lg text-sm font-medium text-white">
              Start Adaptive Quiz
            </Link>
            <Link to="/progress" className="secondary-btn px-5 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#e2e8f0' }}>
              View Progress
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Learning Roadmap</h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Your personalized path to mastering {latestReport.topic}
            </p>
          </div>
          <Link to="/progress" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to Progress
          </Link>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            <BookOpen size={12} className="inline mr-1" />
            {latestReport.topic}
          </span>
          <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
            {roadmapWeeks.length} Weeks
          </span>
          <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>
            {weaknessCards.length} Focus Areas
          </span>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="glass-panel rounded-[16px] border border-slate-700/50 p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400" />
          Weekly Learning Path
        </h2>

        <div className="space-y-6">
          {roadmapWeeks.map((week, weekIndex) => (
            <div key={week.week} className="relative">
              {/* Week Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${week.completed ? 'bg-green-500/20 text-green-400 border-2 border-green-500' : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'}`}>
                    {week.completed ? <CheckCircle2 size={20} /> : week.week}
                  </div>
                  {weekIndex < roadmapWeeks.length - 1 && (
                    <div className="w-0.5 h-full min-h-[120px] mt-2" style={{ background: 'linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(59,130,246,0.1))' }}></div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-white">Week {week.week}</h3>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>
                        {week.days.length} days
                      </span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#cbd5e1' }}>{week.goal}</p>

                    {/* Daily Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {week.days.slice(0, 5).map((day, dayIndex) => (
                        <div key={`${week.week}_${day.day}`} className="rounded-lg p-3" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.2)' }}>
                          <p className="text-xs font-semibold text-blue-300 mb-2">{day.day}</p>
                          <div className="space-y-2">
                            {day.tasks.slice(0, 2).map((task, taskIndex) => (
                              <div key={taskIndex} className="text-xs">
                                <p className="text-white font-medium mb-0.5">{task.title}</p>
                                <p className="text-slate-400 text-[10px] mb-1">{task.duration}min • {task.concept}</p>
                                {task.resource?.url && (
                                  <a href={task.resource.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1">
                                    {task.resource.title || 'Resource'} <ArrowRight size={10} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      {weaknessCards.length > 0 && (
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
          <h2 className="text-lg font-bold text-white mb-4">Priority Focus Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {weaknessCards.map((item, index) => (
              <div key={item.concept} className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                    #{index + 1}
                  </span>
                  <span className="text-xs" style={{ color: '#fcd34d' }}>{item.weakness}% gap</span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">{item.concept}</p>
                <p className="text-xs" style={{ color: '#cbd5e1' }}>{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningPathPage
