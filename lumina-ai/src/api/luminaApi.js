import { apiRequest, buildQuery } from './client'

export const luminaApi = {
  signup: (payload) => {
    return apiRequest('/auth/signup', { method: 'POST', body: payload, requiresAuth: false })
  },

  login: (payload) => {
    return apiRequest('/auth/login', { method: 'POST', body: payload, requiresAuth: false })
  },

  saveGoals: (payload) => {
    return apiRequest('/onboarding/goals', { method: 'POST', body: payload })
  },

  getGoals: (userId) => {
    return apiRequest(`/onboarding/goals/${encodeURIComponent(userId)}`)
  },

  startQuiz: (payload) => {
    return apiRequest('/quiz/start', { method: 'POST', body: payload })
  },

  submitQuizAnswer: (payload) => {
    return apiRequest('/quiz/answer', { method: 'POST', body: payload })
  },

  getQuizResult: (sessionId) => {
    return apiRequest(`/quiz/result${buildQuery({ session_id: sessionId })}`)
  },

  generatePlan: (payload) => {
    return apiRequest('/plan/generate', { method: 'POST', body: payload })
  },

  getPlan: (userId) => {
    return apiRequest(`/plan/${encodeURIComponent(userId)}`)
  },

  getPlanReport: (userId) => {
    return apiRequest(`/plan/report/${encodeURIComponent(userId)}`)
  },

  getDashboard: (userId) => {
    return apiRequest(`/dashboard/${encodeURIComponent(userId)}`)
  },

  getProgress: (userId) => {
    return apiRequest(`/progress/${encodeURIComponent(userId)}`)
  },

  getResources: (userId, filters = {}) => {
    const query = buildQuery(filters || {})
    return apiRequest(`/resources/${encodeURIComponent(userId)}${query}`)
  },

  getSettings: (userId) => {
    return apiRequest(`/settings/${encodeURIComponent(userId)}`)
  },

  updateSettings: (userId, payload) => {
    return apiRequest(`/settings/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: payload,
    })
  },

  // Agent interactions
  createProfile: (payload) => {
    return apiRequest('/agents/profile', { method: 'POST', body: payload })
  },

  askMentor: (payload) => {
    return apiRequest('/agents/mentor', { method: 'POST', body: payload })
  },

  curateContent: (payload) => {
    return apiRequest('/agents/curate', { method: 'POST', body: payload })
  },
}
