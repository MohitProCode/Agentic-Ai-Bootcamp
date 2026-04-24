import React, { useState } from 'react'
import { Calendar, Download, TrendingUp, Clock, BarChart2, Target } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import useStore from '../../store/useStore'
import { Avatar } from '../../components/ui/index'

const Toast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl"
    style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(59,130,246,0.4)', backdropFilter: 'blur(12px)' }}>
    <i className="fa-solid fa-circle-check text-blue-400" />
    {msg}
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><i className="fa-solid fa-xmark" /></button>
  </div>
)

const ProgressPage = () => {
  const progress = useStore(s => s.progress)
  const [moduleFilter, setModuleFilter] = useState('All Modules')
  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleExport = () => {
    const blob = new Blob([`Lumina AI Progress Report\n\nPlan Completion: ${progress.planCompletion}%\nTime Spent: ${progress.timeSpent.hours}h ${progress.timeSpent.minutes}m\nQuiz Average: ${progress.quizAverage}%\nWeekly Goals: ${progress.weeklyGoals.completed}/${progress.weeklyGoals.total}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lumina-progress-report.txt'; a.click()
    URL.revokeObjectURL(url)
    showToast('Progress report exported!')
  }

  const handleSendNote = () => {
    if (!note.trim()) return
    setNotes(prev => [...prev, { text: note, time: 'just now' }])
    setNote('')
    showToast('Note sent to mentor!')
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="custom-tooltip">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="font-semibold">{payload[0].value}%</p>
      </div>
    )
    return null
  }

  const heatmap = progress.heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeks = ['W1', 'W2', 'W3', 'W4']
  const heatColor = (val) => {
    if (!val) return 'rgba(255,255,255,0.04)'
    return `rgba(59,130,246,${0.2 + Math.min(1, val / 5) * 0.7})`
  }

  const statCards = [
    {
      label: 'Plan Completion', value: `${progress.planCompletion}%`,
      delta: `↑ ${progress.planCompletionDelta}% this week`, deltaPos: true,
      iconEl: (
        <div className="relative w-12 h-12">
          <svg className="rotate-[-90deg]" width="48" height="48" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 15 * progress.planCompletion / 100} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-trophy text-blue-400 text-xs" />
          </div>
        </div>
      )
    },
    {
      label: 'Time Spent', value: `${progress.timeSpent.hours}h ${progress.timeSpent.minutes}m`,
      delta: `↑ ${progress.timeSpentDelta}`, deltaPos: true,
      iconEl: <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><Clock size={18} className="text-blue-400" /></div>
    },
    {
      label: 'Quiz Average', value: `${progress.quizAverage}%`, delta: '— Steady', deltaPos: null,
      iconEl: <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><BarChart2 size={18} className="text-blue-400" /></div>
    },
    {
      label: 'Weekly Goals', value: `${progress.weeklyGoals.completed}/${progress.weeklyGoals.total}`,
      delta: `${progress.weeklyGoals.total - progress.weeklyGoals.completed} goal remaining`, deltaPos: null,
      iconEl: <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><Target size={18} className="text-blue-400" /></div>
    },
  ]

  const dateFilters = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days']

  return (
    <div className="p-6 flex flex-col gap-6">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress Tracking</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Monitor your learning journey and bootcamp performance.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range toggle */}
          <div className="flex p-1 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}>
            {dateFilters.map(f => (
              <button key={f} onClick={() => setDateRange(f)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: dateRange === f ? '#1e293b' : 'transparent',
                  color: dateRange === f ? '#60a5fa' : '#94a3b8',
                  border: dateRange === f ? '1px solid #334155' : '1px solid transparent',
                }}>
                <Calendar size={11} /> {f}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 primary-btn">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card rounded-[16px] p-5 flex items-center justify-between" style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>{card.label}</p>
              <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
              <p className={`text-xs font-medium flex items-center gap-1 ${card.deltaPos === true ? 'text-emerald-400' : card.deltaPos === false ? 'text-red-400' : 'text-slate-500'}`}>
                {card.deltaPos === true && <TrendingUp size={11} />}{card.delta}
              </p>
            </div>
            {card.iconEl}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-panel rounded-[16px] border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Quiz Performance Trend</h2>
            <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
              className="text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', color: '#cbd5e1' }}>
              {['All Modules', 'Module 1', 'Module 2', 'Module 3'].map(o => (
                <option key={o} style={{ background: '#0f172a' }}>{o}</option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progress.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Skill Mastery</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={progress.skillMastery} outerRadius={90}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Mastery" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap + Coaching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2 glass-panel rounded-[16px] border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Time Distribution Heatmap</h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
              <span>Less</span>
              {[0.1, 0.3, 0.6, 0.9].map((o, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: `rgba(59,130,246,${o})` }} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="flex gap-2 mb-1 pl-7">
            {days.map(d => <div key={d} className="flex-1 text-center text-[10px]" style={{ color: '#475569' }}>{d}</div>)}
          </div>
          <div className="flex flex-col gap-1.5">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex items-center gap-2">
                <span className="text-[10px] w-5 shrink-0" style={{ color: '#475569' }}>{weeks[wi]}</span>
                <div className="flex gap-2 flex-1">
                  {week.map((val, di) => (
                    <div key={di} title={`${days[di]}: ${val}h`}
                      className="flex-1 h-6 rounded-sm transition-all cursor-default hover:opacity-80"
                      style={{ background: heatColor(val) }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coaching Notes */}
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Coaching Notes</h2>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Bootcamp Mentor</span>
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto mb-4 max-h-[200px] pr-1">
            {[
              { name: 'Sarah Jenkins', time: 'yesterday', text: "Great progress on the React hooks module! For the next week, focus more on the advanced routing concepts." },
              { name: 'Sarah Jenkins', time: 'last week', text: "Make sure you're spending enough time on the practical exercises. Hands-on practice is where it clicks." },
              ...notes.map(n => ({ name: 'You', time: n.time, text: n.text })),
            ].map((note, i) => (
              <div key={i} className="flex gap-3">
                <Avatar name={note.name} size={28} className="shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{note.name}</span>
                    <span className="text-[10px]" style={{ color: '#64748b' }}>{note.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{note.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendNote())}
              placeholder="Add a note or reply to mentor… (Enter to send)"
              rows={3}
              className="w-full p-3 pr-12 rounded-lg text-sm resize-none outline-none"
              style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', color: '#e2e8f0' }} />
            <button onClick={handleSendNote}
              className="absolute bottom-2 right-2 w-8 h-8 rounded flex items-center justify-center text-white transition-colors hover:bg-blue-500"
              style={{ background: '#2563eb' }}>
              <i className="fa-solid fa-paper-plane text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressPage
