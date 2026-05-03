const clampPercent = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

const formatMinutes = (minutes) => {
  const numeric = Number(minutes)
  if (!Number.isFinite(numeric)) return '0m'
  if (numeric >= 60) {
    const hours = Math.floor(numeric / 60)
    const mins = numeric % 60
    return `${hours}h ${mins}m`
  }
  return `${numeric}m`
}

const statusToRoadmapStatus = (status) => {
  if (status === 'in_progress') return 'in-progress'
  if (status === 'completed') return 'completed'
  return 'locked'
}

const dayIndex = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

const normalizeResourceUrl = (resource = {}) => {
  const value =
    resource.url ??
    resource.link ??
    resource.resource_url ??
    resource.external_url ??
    ''

  const url = String(value || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (/^www\./i.test(url)) return `https://${url}`
  return ''
}

const splitFullName = (fullName) => {
  const clean = String(fullName || '').trim()
  if (!clean) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = clean.split(/\s+/)
  return {
    firstName,
    lastName: rest.join(' '),
  }
}

export const mapAuthUserToStore = (authUser = {}) => {
  const fullName = authUser.full_name || ''
  const profile = authUser.profile && typeof authUser.profile === 'object' ? authUser.profile : null
  return {
    id: authUser.user_id || authUser.id || '',
    name: fullName.split(' ')[0] || authUser.email?.split('@')[0] || 'Learner',
    fullName: fullName || 'Learner',
    email: authUser.email || '',
    avatar: authUser.avatar_url || null,
    role: authUser.role === 'admin' ? 'admin' : 'student',
    ...(profile ? { profile } : {}),
    isAuthenticated: true,
  }
}

export const mapSettingsToViewModel = (settings = {}, fallbackUser = {}) => {
  const fallbackName = splitFullName(fallbackUser?.fullName || fallbackUser?.name || '')
  const profile = settings?.profile || {}
  const preferences = settings?.preferences || {}

  const firstName = String(profile.first_name || fallbackName.firstName || '').trim()
  const lastName = String(profile.last_name || fallbackName.lastName || '').trim()
  const fullName = `${firstName} ${lastName}`.trim() || fallbackUser?.fullName || fallbackUser?.name || 'Learner'

  return {
    profile: {
      firstName,
      lastName,
      email: String(profile.email || fallbackUser?.email || '').trim(),
      bio: String(profile.bio || fallbackUser?.bio || '').trim(),
      avatarUrl: String(profile.avatar_url || fallbackUser?.avatar || '').trim(),
    },
    preferences: {
      language: String(preferences.language || 'English'),
      timezone: String(preferences.timezone || 'Asia/Kolkata'),
      notificationsEnabled: Boolean(
        typeof preferences.notifications_enabled === 'boolean' ? preferences.notifications_enabled : true
      ),
      weeklyReportEnabled: Boolean(
        typeof preferences.weekly_report_enabled === 'boolean' ? preferences.weekly_report_enabled : true
      ),
      appearance: ['Dark', 'Light', 'System'].includes(preferences.appearance)
        ? preferences.appearance
        : 'Dark',
    },
    userPatch: {
      fullName,
      name: firstName || fallbackUser?.name || 'Learner',
      email: String(profile.email || fallbackUser?.email || '').trim(),
      bio: String(profile.bio || fallbackUser?.bio || '').trim(),
      avatar: String(profile.avatar_url || fallbackUser?.avatar || '').trim() || null,
    },
  }
}

export const mapDashboardToStore = (dashboard = {}) => {
  const metrics = Array.isArray(dashboard.metrics) ? dashboard.metrics : []
  const completionMetric = metrics.find((m) => /completion/i.test(m.label || ''))
  const completionPercent = completionMetric
    ? Number(String(completionMetric.value || '0').replace(/[^\d]/g, ''))
    : 0

  const pathNodes = Array.isArray(dashboard.path_nodes) ? dashboard.path_nodes : []
  const modules = pathNodes.map((node, index) => ({
    id: index + 1,
    title: node.title || `Module ${index + 1}`,
    subtitle: node.module || `Module ${index + 1}`,
    status: statusToRoadmapStatus(node.status),
    completion: node.status === 'completed' ? 100 : node.status === 'in_progress' ? 60 : 0,
  }))

  const currentModuleIndex = modules.findIndex((node) => node.status === 'in-progress')
  const currentModule = currentModuleIndex >= 0 ? currentModuleIndex + 1 : 1

  const tasks = (Array.isArray(dashboard.tasks) ? dashboard.tasks : []).map((task, index) => ({
    id: `task_${index + 1}`,
    title: task.title,
    detail: task.details,
    done: task.status === 'completed',
    required: Boolean(task.required),
  }))

  const consistency = Array.isArray(dashboard.consistency)
    ? dashboard.consistency.map((point) => ({
        day: point.day,
        hours: Number(point.hours || 0),
      }))
    : []

  return {
    userPatch: {
      streak: Number(dashboard.streak_days || 0),
      rank: dashboard.rank_label || 'Silver',
    },
    tasks,
    roadmap: {
      currentModule,
      modules,
      upNext: {
        title: dashboard.upcoming_lesson || 'Next lesson',
        subtitle: `Next up | ${dashboard.upcoming_minutes_remaining || 0} min remaining`,
        progress: clampPercent(completionPercent || modules[currentModule - 1]?.completion || 0),
      },
    },
    consistency,
  }
}

export const mapProgressToStore = (progress = {}) => {
  const totalHours = Number(progress.time_spent_hours || 0)
  const hours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - hours) * 60)

  const weeklyData = (Array.isArray(progress.trend_points) ? progress.trend_points : []).map((item) => ({
    week: item.label,
    score: Math.round(Number(item.score || 0)),
  }))

  const skillMastery = (Array.isArray(progress.skill_mastery) ? progress.skill_mastery : []).map((item) => ({
    skill: item.skill,
    value: Math.round(Number(item.score || 0)),
  }))

  const heatmap = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]

  ;(Array.isArray(progress.heatmap) ? progress.heatmap : []).forEach((cell) => {
    const weekLabel = String(cell.week || '')
    const weekIndex = Number(weekLabel.replace(/[^\d]/g, '')) - 1
    const day = dayIndex[cell.day]
    if (Number.isInteger(weekIndex) && weekIndex >= 0 && weekIndex < heatmap.length && Number.isInteger(day)) {
      heatmap[weekIndex][day] = Number(cell.intensity || 0)
    }
  })

  const coachingNotes = (Array.isArray(progress.coaching_notes) ? progress.coaching_notes : []).map((note) => ({
    name: note.mentor,
    time: note.posted_at,
    text: note.note,
  }))

  return {
    planCompletion: clampPercent(progress.plan_completion),
    timeSpent: { hours, minutes },
    timeSpentDelta: `${formatMinutes(Math.round(totalHours * 60))} logged`,
    quizAverage: clampPercent(progress.quiz_average),
    weeklyGoals: {
      completed: Number(progress.weekly_goals_completed || 0),
      total: Number(progress.weekly_goals_target || 0),
    },
    weeklyData,
    skillMastery,
    heatmap,
    coachingNotes,
  }
}

export const mapResourcesToStore = (resourcePayload = {}) => {
  const recommended = (Array.isArray(resourcePayload.recommended) ? resourcePayload.recommended : []).map((item) => ({
    id: item.resource_id,
    matchScore: Number(item.match_score || 0),
    type: item.resource_type,
    duration: `${item.duration_minutes} mins`,
    title: item.title,
    description: item.description,
    tags: Array.isArray(item.tags) ? item.tags : [],
    url: normalizeResourceUrl(item),
  }))

  const allResources = (Array.isArray(resourcePayload.resources) ? resourcePayload.resources : []).map((item) => ({
    id: item.resource_id,
    type: String(item.resource_type || '').toLowerCase(),
    title: item.title,
    description: item.description,
    duration: `${item.duration_minutes}m`,
    level: item.level,
    tags: Array.isArray(item.tags) ? item.tags : [],
    matchScore: Number(item.match_score || 0),
    saved: Boolean(item.saved),
    url: normalizeResourceUrl(item),
  }))

  const analyticsList = Array.isArray(resourcePayload.analytics) ? resourcePayload.analytics : []
  const analyticsBreakdown = analyticsList.map((segment) => ({
    name: String(segment.label || 'Other'),
    value: Number(segment.count || 0),
  }))
  const analytics = analyticsList.reduce((acc, segment) => {
    const key = String(segment.label || '').toLowerCase().replace(/\s+/g, '_')
    acc[key] = Number(segment.count || 0)
    acc.total += Number(segment.count || 0)
    return acc
  }, { total: 0 })

  const topics = (Array.isArray(resourcePayload.topics) ? resourcePayload.topics : []).map((topic) => ({
    name: topic,
    count: allResources.filter((resource) =>
      resource.tags.some((tag) => String(tag).toLowerCase() === String(topic).toLowerCase())
    ).length,
  }))

  return {
    saved: Number(resourcePayload.saved_count || 0),
    recommended,
    allResources,
    analytics,
    analyticsBreakdown,
    topics,
  }
}
