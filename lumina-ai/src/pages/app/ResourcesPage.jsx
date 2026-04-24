import React, { useState } from 'react'
import {
  Search, Bookmark, BookmarkCheck, ChevronDown, ChevronLeft,
  ChevronRight, Filter, Play, FileText, Monitor, X, Grid, List, Plus, CheckCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import useStore from '../../store/useStore'

const Toast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl"
    style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(59,130,246,0.4)', backdropFilter: 'blur(12px)' }}>
    <i className="fa-solid fa-circle-check text-blue-400" />{msg}
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><X size={14} /></button>
  </div>
)

// ─── Resources Page ───────────────────────────
// Screen 7: Resource library with search, filters, recommended, analytics
const ResourcesPage = () => {
  const resources = useStore(s => s.resources)
  const setResourceFilter = useStore(s => s.setResourceFilter)

  const [searchQuery, setSearchQuery] = useState('')
  const [recIndex, setRecIndex] = useState(0)
  const [savedIds, setSavedIds] = useState(['r5'])
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedRes, setSelectedRes] = useState(null)
  const [addedToPlans, setAddedToPlans] = useState([])
  const [completedIds, setCompletedIds] = useState([])
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const openPanel = (res) => { setSelectedRes(res); setPanelOpen(true) }
  const closePanel = () => setPanelOpen(false)

  const handleAddToPlan = (id) => {
    setAddedToPlans(prev => prev.includes(id) ? prev : [...prev, id])
    showToast('Added to your learning plan!')
  }
  const handleMarkComplete = (id) => {
    setCompletedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    showToast('Marked as complete!')
  }
  const handleClearFilters = () => {
    ['topic','level','format','duration'].forEach(k => setResourceFilter(k, 'All'))
    setSearchQuery('')
    showToast('Filters cleared')
  }

  const toggleSave = (id) => {
    setSavedIds(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
    )
  }

  // Pie chart data
  const pieData = [
    { name: 'React', value: 12, color: '#3b82f6' },
    { name: 'JS', value: 8, color: '#10b981' },
    { name: 'CSS', value: 5, color: '#8b5cf6' },
    { name: 'Other', value: 3, color: '#475569' },
  ]

  const formatIcon = (type) => {
    const t = type?.toLowerCase()
    if (t === 'video')       return <Play     size={12} className="text-blue-400" />
    if (t === 'article')     return <FileText  size={12} className="text-emerald-400" />
    if (t === 'interactive') return <Monitor   size={12} className="text-purple-400" />
    if (t === 'project')     return <CheckCircle size={12} className="text-orange-400" />
    return <Monitor size={12} className="text-slate-400" />
  }

  const matchColor = (score) => {
    if (score >= 95) return '#10b981'
    if (score >= 90) return '#3b82f6'
    return '#8b5cf6'
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip">
          {payload[0].name}: {payload[0].value}
        </div>
      )
    }
    return null
  }

  // Filter resources by search
  const filteredAll = resources.allResources.filter(r =>
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 flex flex-col gap-5 relative">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── SLIDE PANEL ── */}
      {panelOpen && selectedRes && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={closePanel} />
          <div className="w-full max-w-[400px] flex flex-col shadow-2xl" style={{ background: '#0f172a', borderLeft: '1px solid #334155' }}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1e293b' }}>
              <h2 className="text-sm font-semibold text-white">Resource Details</h2>
              <button onClick={closePanel} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="w-full h-40 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ background: '#1e293b' }}>
                <div className="text-5xl opacity-30">{selectedRes.type === 'video' ? '🎬' : '📄'}</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style={{ background: '#2563eb' }}>
                    <Play size={18} className="text-white ml-1" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{selectedRes.type}</span>
                  <span className="text-xs" style={{ color: '#64748b' }}>• {selectedRes.duration}</span>
                  {completedIds.includes(selectedRes.id) && <span className="text-[10px] px-2 py-1 rounded text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)' }}>✓ Completed</span>}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedRes.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{selectedRes.description}</p>
              </div>
              <div className="flex flex-col gap-3" style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                <button onClick={() => handleAddToPlan(selectedRes.id)}
                  className={`w-full rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${addedToPlans.includes(selectedRes.id) ? '' : 'primary-btn'}`}
                  style={addedToPlans.includes(selectedRes.id) ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80' } : { color: 'white' }}>
                  {addedToPlans.includes(selectedRes.id) ? <><CheckCircle size={14} /> Added to Plan</> : <><Plus size={14} /> Add to Learning Plan</>}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleMarkComplete(selectedRes.id)}
                    className="secondary-btn rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center gap-2"
                    style={{ color: completedIds.includes(selectedRes.id) ? '#4ade80' : '#e2e8f0' }}>
                    <CheckCircle size={14} /> {completedIds.includes(selectedRes.id) ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button onClick={() => { toggleSave(selectedRes.id); showToast(savedIds.includes(selectedRes.id) ? 'Removed from saved' : 'Saved!') }}
                    className="secondary-btn rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center gap-2" style={{ color: '#e2e8f0' }}>
                    <Bookmark size={14} /> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── HEADER ────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resource Library</h1>
          <p className="text-sm text-slate-500 mt-1">Curated materials to accelerate your learning path.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-slate-600 outline-none w-48"
            />
          </div>

          <button
            onClick={() => showToast(`You have ${savedIds.length} saved resources`)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/10"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Bookmark size={14} />
            Saved ({savedIds.length})
          </button>
        </div>
      </div>

      {/* ── FILTERS ───────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
          <Filter size={13} />
          <span>Filters</span>
        </div>
        {[
          { key: 'topic', options: ['All', 'React', 'JS', 'CSS', 'TypeScript'] },
          { key: 'level', options: ['All', 'Beginner', 'Intermediate', 'Advanced'] },
          { key: 'format', options: ['All', 'Video', 'Article', 'Interactive'] },
          { key: 'duration', options: ['All', '< 15 min', '15-30 min', '30-60 min'] },
        ].map(f => (
          <div key={f.key} className="relative">
            <select
              value={resources.filters[f.key]}
              onChange={e => setResourceFilter(f.key, e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              className="text-xs text-slate-300 rounded-lg px-3 py-1.5 pr-7 appearance-none focus:outline-none cursor-pointer capitalize"
            >
              {f.options.map(o => (
                <option key={o} style={{ background: '#0d1624' }}>{f.key.charAt(0).toUpperCase() + f.key.slice(1)}: {o}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        ))}
        <button onClick={handleClearFilters} className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear Filters</button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────── */}
      <div className="grid grid-cols-[1fr_280px] gap-5">
        {/* Left: Recommendations + All Resources */}
        <div className="flex flex-col gap-5">
          {/* AI Recommended */}
          <div className="rounded-2xl p-5" style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                  <span className="text-[9px] font-bold text-blue-400">i</span>
                </div>
                <h2 className="text-base font-bold text-white">AI Recommended for Your Plan</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRecIndex(i => Math.max(0, i - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronLeft size={13} className="text-slate-400" />
                </button>
                <button
                  onClick={() => setRecIndex(i => Math.min(resources.recommended.length - 1, i + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronRight size={13} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {resources.recommended.map((res, i) => (
                <div
                  key={res.id}
                  className="rounded-xl overflow-hidden transition-all hover:border-white/10 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-28 flex items-center justify-center" style={{ background: '#060c18' }}>
                    <span className="text-3xl opacity-30">
                      {res.type === 'Video' ? '🎬' : res.type === 'Article' ? '📄' : '💻'}
                    </span>
                    {/* Match badge */}
                    <div
                      className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: matchColor(res.matchScore) }}
                    >
                      {res.matchScore}% Match
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {formatIcon(res.type)}
                      <span className="text-[10px] text-slate-500">{res.type} • {res.duration}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1 leading-tight">{res.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{res.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {res.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded text-slate-400"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Resources */}
          <div className="rounded-2xl p-5" style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">All Resources</h2>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}>
                <button onClick={() => setViewMode('grid')} className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                  style={{ background: viewMode === 'grid' ? '#1e293b' : 'transparent', color: viewMode === 'grid' ? '#60a5fa' : '#94a3b8' }}>
                  <Grid size={13} />
                </button>
                <button onClick={() => setViewMode('list')} className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                  style={{ background: viewMode === 'list' ? '#1e293b' : 'transparent', color: viewMode === 'list' ? '#60a5fa' : '#94a3b8' }}>
                  <List size={13} />
                </button>
              </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
              {filteredAll.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm" style={{ color: '#64748b' }}>No resources match your search.</div>
              )}
              {filteredAll.map(res => (
                <div key={res.id}
                  onClick={() => openPanel(res)}
                  className={`rounded-xl p-4 transition-all hover:border-blue-500/30 cursor-pointer relative group ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <button onClick={e => { e.stopPropagation(); toggleSave(res.id) }}
                    className="absolute top-3 right-3 text-slate-500 hover:text-blue-400 transition-colors z-10">
                    {savedIds.includes(res.id) ? <BookmarkCheck size={14} className="text-blue-400" /> : <Bookmark size={14} />}
                  </button>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.12)', marginBottom: viewMode === 'grid' ? '0.75rem' : 0 }}>
                    {formatIcon(res.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{res.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{res.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px]" style={{ color: '#64748b' }}>⏱ {res.duration}</span>
                      <span className="text-[10px]" style={{ color: '#64748b' }}>{res.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Analytics + Topics */}
        <div className="flex flex-col gap-4">
          {/* Resource Analytics */}
          <div className="rounded-2xl p-5" style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-bold text-white mb-4">Resource Analytics</h2>
            {/* Donut chart with absolutely-centered label */}
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label — absolutely positioned over donut hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white leading-none">{resources.analytics.total}</span>
                <span className="text-[11px] text-slate-500 mt-1">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Topics */}
          <div className="rounded-2xl p-5" style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-bold text-white mb-3">Your Topics</h2>
            <div className="flex flex-wrap gap-2">
              {resources.topics.map(topic => (
                <button
                  key={topic.name}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white transition-all hover:border-white/15"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  {topic.name} ({topic.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResourcesPage
