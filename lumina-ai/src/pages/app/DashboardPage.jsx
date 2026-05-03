import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { luminaApi } from '../../api/luminaApi'
import { mapDashboardToStore } from '../../api/mappers'

const defaultConsistencyData = {
  'Last 7 Days': [
    { day: 'Mon', hours: 1.5 }, { day: 'Tue', hours: 2.0 }, { day: 'Wed', hours: 0.5 },
    { day: 'Thu', hours: 3.0 }, { day: 'Fri', hours: 2.5 }, { day: 'Sat', hours: 1.0 }, { day: 'Sun', hours: 2.2 },
  ],
  'Last 30 Days': [
    { day: 'W1', hours: 8 }, { day: 'W2', hours: 12 }, { day: 'W3', hours: 7 },
    { day: 'W4', hours: 15 }, { day: 'W5', hours: 11 },
  ],
}

// ─── Toast notification ───────────────────────
const Toast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl animate-fade-in"
    style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(59,130,246,0.4)', backdropFilter: 'blur(12px)' }}>
    <i className="fa-solid fa-circle-check text-blue-400" />
    {msg}
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><i className="fa-solid fa-xmark" /></button>
  </div>
)

const DashboardChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return <div className="custom-tooltip"><b>{label}</b><br />{payload[0].value} hours</div>
  }
  return null
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const tasks = useStore(s => s.tasks)
  const setTasks = useStore(s => s.setTasks)
  const toggleTask = useStore(s => s.toggleTask)
  const roadmap = useStore(s => s.roadmap)
  const setRoadmap = useStore(s => s.setRoadmap)
  const [timeFilter, setTimeFilter] = useState('Last 7 Days')
  const [toast, setToast] = useState(null)
  const [consistencyData, setConsistencyData] = useState(defaultConsistencyData)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id || !user?.isAuthenticated) return
      if (!String(user.id).startsWith('user_')) return
      try {
        const dashboard = await luminaApi.getDashboard(user.id)
        const mapped = mapDashboardToStore(dashboard)
        setUser(mapped.userPatch)
        setTasks(mapped.tasks)
        setRoadmap(mapped.roadmap)

        if (mapped.consistency.length > 0) {
          const weeklyBuckets = []
          for (let index = 0; index < mapped.consistency.length; index += 7) {
            const chunk = mapped.consistency.slice(index, index + 7)
            const total = chunk.reduce((acc, item) => acc + Number(item.hours || 0), 0)
            weeklyBuckets.push({ day: `W${weeklyBuckets.length + 1}`, hours: Number(total.toFixed(1)) })
          }
          setConsistencyData({
            'Last 7 Days': mapped.consistency,
            'Last 30 Days': weeklyBuckets.length ? weeklyBuckets : defaultConsistencyData['Last 30 Days'],
          })
        }
      } catch (apiError) {
        showToast(apiError?.message || 'Using local dashboard data. Backend sync unavailable.')
      }
    }

    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isAuthenticated])

  const handleTaskClick = (task) => {
    if (!task.done && /quiz/i.test(task.title || '')) {
      navigate('/quiz-checkin')
      return
    }
    toggleTask(task.id)
  }

  const chartData = useMemo(() => consistencyData[timeFilter] || [], [consistencyData, timeFilter])

  return (
    <main id="dashboard_main" className="flex-1 w-full max-w-[1440px] mx-auto relative z-10 px-6 py-8 overflow-y-auto">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ── LEFT COLUMN ── */}
        <div className="xl:col-span-8 flex flex-col gap-8">

          {/* Welcome Hero */}
          <section className="glass-panel rounded-[16px] p-8 border border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.1), transparent)' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back, {user.name}</h1>
                <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>You're on day {user.streak} of your learning streak. Keep the momentum going!</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <i className="fa-solid fa-fire text-orange-500" /> {user.streak} Day Streak
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', color: '#cbd5e1' }}>
                    <i className="fa-solid fa-trophy text-yellow-500" /> Rank: {user.rank}
                  </div>
                </div>
              </div>

              {/* Up Next card */}
              <div className="w-full md:w-auto rounded-[12px] p-5" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 block">Up Next</span>
                <h3 className="text-white font-medium mb-1">{roadmap.upNext.title}</h3>
                <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>{roadmap.upNext.subtitle}</p>
                <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: '#1e293b' }}>
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${roadmap.upNext.progress}%` }} />
                </div>
                <button
                  onClick={() => showToast('Opening Advanced React Hooks lesson…')}
                  className="w-full primary-btn rounded-[8px] py-2 px-4 text-sm font-semibold text-white flex items-center justify-center gap-2">
                  <i className="fa-solid fa-play text-xs" /> Resume Lesson
                </button>
              </div>
            </div>
          </section>

          {/* Tasks + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Tasks */}
            <section className="glass-panel rounded-[16px] border border-slate-700/50 flex flex-col">
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Today's Tasks</h2>
                <button onClick={() => showToast('Task options coming soon')} className="text-sm hover:text-white transition-colors" style={{ color: '#94a3b8' }}>
                  <i className="fa-solid fa-ellipsis" />
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`selectable-card${task.required && !task.done ? ' selected' : ''} rounded-[12px] p-4 flex items-start gap-4 cursor-pointer transition-opacity ${task.done ? 'opacity-60' : 'opacity-100'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={{ border: `2px solid ${task.done ? '#3b82f6' : '#475569'}`, background: task.done ? 'rgba(59,130,246,0.2)' : 'transparent' }}>
                        {task.done && <i className="fa-solid fa-check text-white text-xs" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium mb-1 ${task.done ? 'line-through' : 'text-white'}`} style={{ color: task.done ? '#cbd5e1' : undefined }}>
                        {task.title}
                      </h4>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{task.detail}</p>
                      {task.required && !task.done && (
                        <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] font-medium text-blue-400"
                          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Timeline */}
            <section className="glass-panel rounded-[16px] border border-slate-700/50 flex flex-col">
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Current Path</h2>
                <Link to="/learning-path" className="text-xs font-medium text-blue-400 hover:text-blue-300">View Full Path</Link>
              </div>
              <div className="p-6 flex-1 relative">
                <div className="absolute left-[39px] top-6 bottom-6 w-px z-0" style={{ background: '#1e293b' }} />
                <div className="flex flex-col gap-6 relative z-10">
                  {roadmap.modules.map((mod) => (
                    <div key={mod.id}
                      onClick={() => mod.status !== 'locked' && showToast(`Opening: ${mod.title}`)}
                      className={`flex gap-4 ${mod.status === 'locked' ? 'opacity-50' : 'cursor-pointer group'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          background: mod.status === 'completed' ? '#1e293b' : mod.status === 'in-progress' ? '#2563eb' : '#0f172a',
                          border: mod.status === 'completed' ? '1px solid #3b82f6' : mod.status === 'in-progress' ? '2px solid #0f172a' : '1px solid #334155',
                          boxShadow: mod.status === 'in-progress' ? '0 0 0 2px rgba(59,130,246,0.5)' : 'none',
                        }}>
                        {mod.status === 'completed' && <i className="fa-solid fa-check text-blue-500 text-xs" />}
                        {mod.status === 'in-progress' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        {mod.status === 'locked' && <span className="text-xs font-medium" style={{ color: '#64748b' }}>{mod.id}</span>}
                      </div>
                      <div className="pt-1">
                        <h4 className={`text-sm font-medium mb-1 ${mod.status === 'in-progress' ? 'text-white' : ''}`}
                          style={{ color: mod.status === 'locked' ? '#94a3b8' : mod.status === 'completed' ? '#cbd5e1' : undefined }}>
                          {mod.title}
                        </h4>
                        <p className={`text-xs ${mod.status === 'in-progress' ? 'text-blue-400' : ''}`}
                          style={{ color: mod.status !== 'in-progress' ? '#64748b' : undefined }}>
                          {mod.subtitle} • {mod.status === 'completed' ? 'Completed' : mod.status === 'in-progress' ? 'In Progress' : 'Locked'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Consistency Chart */}
          <section className="glass-panel rounded-[16px] border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Learning Consistency</h2>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Hours spent per day</p>
              </div>
              <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}
                className="text-xs rounded-md px-3 py-1.5 outline-none cursor-pointer"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1' }}>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DashboardChartTooltip />} />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fill="url(#areaGrad)"
                    dot={{ fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#0f172a', stroke: '#60a5fa', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="xl:col-span-4 flex flex-col gap-8">

          {/* Quick Links */}
          <section className="grid grid-cols-2 gap-4">
            {[
              { icon: 'fa-solid fa-book-open', label: 'Resources', to: '/resources', color: 'rgba(59,130,246,0.1)', iconClass: 'text-blue-400' },
              { icon: 'fa-solid fa-chart-pie', label: 'Progress', to: '/progress', color: 'rgba(168,85,247,0.1)', iconClass: 'text-purple-400' },
              { icon: 'fa-solid fa-route', label: 'Learning Path', to: '/learning-path', color: 'rgba(16,185,129,0.1)', iconClass: 'text-emerald-400' },
              { icon: 'fa-solid fa-certificate', label: 'Certificates', to: null, color: 'rgba(249,115,22,0.1)', iconClass: 'text-orange-400' },
            ].map(ql => ql.to ? (
              <Link key={ql.label} to={ql.to}
                className="glass-panel rounded-[12px] p-4 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 transition-all group flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: ql.color }}>
                  <i className={`${ql.icon} ${ql.iconClass}`} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{ql.label}</span>
              </Link>
            ) : (
              <button key={ql.label} onClick={() => showToast(`${ql.label} coming soon!`)}
                className="glass-panel rounded-[12px] p-4 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 transition-all group flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: ql.color }}>
                  <i className={`${ql.icon} ${ql.iconClass}`} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{ql.label}</span>
              </button>
            ))}
          </section>

          {/* Announcements */}
          <section className="glass-panel rounded-[16px] border border-slate-700/50 flex flex-col flex-1">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Cohort Announcements</h2>
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: '#2563eb' }}>2</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="rounded-[12px] p-4 relative overflow-hidden" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Live Session</span>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>• Today, 2:00 PM</span>
                </div>
                <h4 className="text-sm font-medium text-white mb-2">Q&A: React Performance Tuning</h4>
                <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>Join instructor Sarah for a deep dive into useMemo, useCallback, and React.memo practical applications.</p>
                <button onClick={() => showToast('Opening Zoom link…')} className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  Join Zoom <i className="fa-solid fa-arrow-right ml-1" />
                </button>
              </div>
              <div className="rounded-[12px] p-4 relative overflow-hidden" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">New Resource</span>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>• Yesterday</span>
                </div>
                <h4 className="text-sm font-medium text-white mb-2">Updated Cheat Sheet</h4>
                <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>We've added a new downloadable PDF covering the most common custom hooks patterns.</p>
                <button onClick={() => showToast('Downloading PDF…')} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  Download PDF <i className="fa-solid fa-download ml-1" />
                </button>
              </div>
            </div>
          </section>
        </div>

      </div>
    </main>
  )
}

export default DashboardPage
