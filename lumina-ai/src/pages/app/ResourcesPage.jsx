import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Play,
  FileText,
  Monitor,
  Grid,
  List,
  ExternalLink,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'
import { mapResourcesToStore } from '../../api/mappers'

const chartPalette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#06b6d4']

const Toast = ({ msg, onClose }) => (
  <div
    className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl"
    style={{
      background: 'rgba(30,41,59,0.95)',
      border: '1px solid rgba(59,130,246,0.4)',
      backdropFilter: 'blur(12px)',
    }}
  >
    <i className="fa-solid fa-circle-check text-blue-400" />
    {msg}
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white">
      x
    </button>
  </div>
)

const ResourcesPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      {payload[0].name}: {payload[0].value}
    </div>
  )
}

const normalize = (value) => String(value || '').trim().toLowerCase()

const buildFallbackResourceUrl = (resource) => {
  const title = String(resource?.title || '').trim()
  if (!title) return ''
  const keywords = [title, resource?.type, resource?.level, 'tutorial']
    .filter(Boolean)
    .join(' ')
  return `https://www.google.com/search?q=${encodeURIComponent(keywords)}`
}

const resolveResourceUrl = (resource) => {
  const value = String(resource?.url || '').trim()
  if (value) return value
  return buildFallbackResourceUrl(resource)
}

const getResourceHostLabel = (resource) => {
  const url = resolveResourceUrl(resource)
  if (!url) return 'No link available'
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    return host || 'external resource'
  } catch {
    return 'external resource'
  }
}

const isDurationMatch = (resourceDuration, selectedDuration) => {
  if (selectedDuration === 'All') return true
  const minutes = Number(String(resourceDuration || '').replace(/[^\d]/g, ''))
  if (!Number.isFinite(minutes)) return true
  if (selectedDuration === '< 15 min') return minutes < 15
  if (selectedDuration === '15-30 min') return minutes >= 15 && minutes <= 30
  if (selectedDuration === '30-60 min') return minutes > 30 && minutes <= 60
  return true
}

const formatIcon = (type) => {
  const normalizedType = normalize(type)
  if (normalizedType === 'video') return <Play size={12} className="text-blue-400" />
  if (normalizedType === 'article') return <FileText size={12} className="text-emerald-400" />
  if (normalizedType === 'interactive') return <Monitor size={12} className="text-purple-400" />
  return <Monitor size={12} className="text-slate-400" />
}

const matchColor = (score) => {
  if (score >= 95) return '#10b981'
  if (score >= 90) return '#3b82f6'
  return '#8b5cf6'
}

const ResourcesPage = () => {
  const user = useStore((state) => state.user)
  const resources = useStore((state) => state.resources)
  const setResources = useStore((state) => state.setResources)
  const setResourceFilter = useStore((state) => state.setResourceFilter)

  const [searchQuery, setSearchQuery] = useState('')
  const [recIndex, setRecIndex] = useState(0)
  const [savedIds, setSavedIds] = useState(['r5'])
  const [viewMode, setViewMode] = useState('grid')
  const [toast, setToast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    const loadResources = async () => {
      if (!user?.id || !user?.isAuthenticated) return
      if (!String(user.id).startsWith('user_')) return
      setIsLoading(true)
      try {
        const payload = await luminaApi.getResources(user.id, {
          topic: resources.filters.topic,
          level: resources.filters.level,
          format: resources.filters.format,
          duration: resources.filters.duration,
        })
        setResources(mapResourcesToStore(payload))
      } catch (apiError) {
        showToast(apiError?.message || 'Using local resource catalog.')
      } finally {
        setIsLoading(false)
      }
    }

    loadResources()
  }, [
    user?.id,
    user?.isAuthenticated,
    resources.filters.topic,
    resources.filters.level,
    resources.filters.format,
    resources.filters.duration,
    setResources,
  ])

  const filteredAll = useMemo(() => {
    return resources.allResources.filter((resource) => {
      const query = normalize(searchQuery)
      const title = normalize(resource.title)
      const description = normalize(resource.description)
      const tags = Array.isArray(resource.tags) ? resource.tags.map(normalize) : []
      const level = normalize(resource.level)
      const resourceType = normalize(resource.type)

      const queryMatch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        tags.some((tag) => tag.includes(query))

      const topicFilter = resources.filters.topic
      const topicMatch =
        topicFilter === 'All' || tags.some((tag) => tag.includes(normalize(topicFilter)))

      const levelMatch =
        resources.filters.level === 'All' || level === normalize(resources.filters.level)

      const formatMatch =
        resources.filters.format === 'All' || resourceType === normalize(resources.filters.format)

      const durationMatch = isDurationMatch(resource.duration, resources.filters.duration)

      return queryMatch && topicMatch && levelMatch && formatMatch && durationMatch
    })
  }, [resources.allResources, resources.filters, searchQuery])

  const visibleRecommended = useMemo(() => {
    if (resources.recommended.length <= 3) return resources.recommended
    return Array.from({ length: 3 }, (_, offset) => {
      const index = (recIndex + offset) % resources.recommended.length
      return resources.recommended[index]
    })
  }, [resources.recommended, recIndex])

  const pieData = useMemo(() => {
    const source = Array.isArray(resources.analyticsBreakdown) ? resources.analyticsBreakdown : []
    if (!source.length) {
      return [
        { name: 'Resources', value: Number(resources.analytics?.total || 0), color: chartPalette[0] },
      ]
    }
    return source
      .filter((item) => Number(item.value || 0) > 0)
      .map((item, index) => ({
        name: item.name,
        value: Number(item.value || 0),
        color: chartPalette[index % chartPalette.length],
      }))
  }, [resources.analytics, resources.analyticsBreakdown])

  const totalResources = useMemo(
    () => pieData.reduce((sum, entry) => sum + Number(entry.value || 0), 0),
    [pieData]
  )

  const topicOptions = useMemo(
    () => ['All', ...new Set((Array.isArray(resources.topics) ? resources.topics : []).map((item) => item.name))],
    [resources.topics]
  )

  const filterConfigs = useMemo(
    () => [
      { key: 'topic', options: topicOptions },
      { key: 'level', options: ['All', 'Beginner', 'Intermediate', 'Advanced'] },
      { key: 'format', options: ['All', 'Video', 'Article', 'Interactive'] },
      { key: 'duration', options: ['All', '< 15 min', '15-30 min', '30-60 min'] },
    ],
    [topicOptions]
  )

  const handleClearFilters = () => {
    ;['topic', 'level', 'format', 'duration'].forEach((key) => setResourceFilter(key, 'All'))
    setSearchQuery('')
    showToast('Filters cleared')
  }

  const toggleSave = (id) => {
    setSavedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

  const openResource = (resource) => {
    const url = resolveResourceUrl(resource)
    if (!url) {
      showToast('No external link available for this resource yet.')
      return
    }
    if (!resource?.url) {
      showToast('Opening a best-match external resource link.')
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="p-6 flex flex-col gap-5 relative">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Resource Library</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time resources from your backend recommendations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
          <Filter size={13} />
          <span>Filters</span>
        </div>
        {filterConfigs.map((filterConfig) => (
          <div key={filterConfig.key} className="relative">
            <select
              value={resources.filters[filterConfig.key]}
              onChange={(event) => setResourceFilter(filterConfig.key, event.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              className="text-xs text-slate-300 rounded-lg px-3 py-1.5 pr-7 appearance-none focus:outline-none cursor-pointer capitalize"
            >
              {filterConfig.options.map((option) => (
                <option key={option} style={{ background: '#0d1624' }}>
                  {filterConfig.key.charAt(0).toUpperCase() + filterConfig.key.slice(1)}: {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        ))}
        <button
          onClick={handleClearFilters}
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="flex flex-col gap-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">AI Recommended for Your Plan</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setRecIndex((value) =>
                      resources.recommended.length ? (value - 1 + resources.recommended.length) % resources.recommended.length : 0
                    )
                  }
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronLeft size={13} className="text-slate-400" />
                </button>
                <button
                  onClick={() =>
                    setRecIndex((value) =>
                      resources.recommended.length ? (value + 1) % resources.recommended.length : 0
                    )
                  }
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ChevronRight size={13} className="text-slate-400" />
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="text-sm text-blue-300">Loading backend resources...</div>
            )}

            {!isLoading && visibleRecommended.length === 0 && (
              <div className="text-sm text-slate-400">No recommendations available yet.</div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {visibleRecommended.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-xl overflow-hidden transition-all hover:border-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="relative h-28 flex items-center justify-center"
                    style={{ background: '#060c18' }}
                  >
                    <div
                      className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: matchColor(resource.matchScore) }}
                    >
                      {resource.matchScore}% Match
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {formatIcon(resource.type)}
                      <span className="text-[10px] text-slate-500">
                        {resource.type} | {resource.duration}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1 leading-tight">{resource.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {resource.description}
                    </p>
                    <a
                      href={resolveResourceUrl(resource)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-[11px] truncate text-slate-400 hover:text-blue-300"
                      title={resolveResourceUrl(resource)}
                    >
                      {getResourceHostLabel(resource)}
                    </a>
                    <button
                      onClick={() => openResource(resource)}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Open
                      <ExternalLink size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">All Resources</h2>
              <div
                className="flex items-center gap-1 p-1 rounded-lg"
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                  style={{
                    background: viewMode === 'grid' ? '#1e293b' : 'transparent',
                    color: viewMode === 'grid' ? '#60a5fa' : '#94a3b8',
                  }}
                >
                  <Grid size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                  style={{
                    background: viewMode === 'list' ? '#1e293b' : 'transparent',
                    color: viewMode === 'list' ? '#60a5fa' : '#94a3b8',
                  }}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
              {filteredAll.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                  No resources match your filters.
                </div>
              )}
              {filteredAll.map((resource) => (
                <div
                  key={resource.id}
                  className={`rounded-xl p-4 transition-all hover:border-blue-500/30 relative group ${
                    viewMode === 'list' ? 'flex items-center gap-4' : ''
                  }`}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <button
                    onClick={() => toggleSave(resource.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-blue-400 transition-colors z-10"
                  >
                    {savedIds.includes(resource.id) ? (
                      <BookmarkCheck size={14} className="text-blue-400" />
                    ) : (
                      <Bookmark size={14} />
                    )}
                  </button>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(59,130,246,0.12)',
                      marginBottom: viewMode === 'grid' ? '0.75rem' : 0,
                    }}
                  >
                    {formatIcon(resource.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {resource.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[10px]" style={{ color: '#64748b' }}>
                        {resource.duration} | {resource.level}
                      </span>
                      <a
                        href={resolveResourceUrl(resource)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] max-w-[48%] truncate hover:text-blue-300"
                        style={{ color: '#94a3b8' }}
                        title={resolveResourceUrl(resource)}
                      >
                        {getResourceHostLabel(resource)}
                      </a>
                      <button
                        onClick={() => openResource(resource)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        Open
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-bold text-white mb-4">Resource Analytics</h2>
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
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}_${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ResourcesPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white leading-none">{totalResources}</span>
                <span className="text-[11px] text-slate-500 mt-1">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: '#0d1624', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-bold text-white mb-3">Your Topics</h2>
            <div className="flex flex-wrap gap-2">
              {resources.topics.map((topic) => (
                <span
                  key={topic.name}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  {topic.name} ({topic.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResourcesPage
