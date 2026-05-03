import { create } from 'zustand'
import {
  appendReportHistory,
  clearAuthSession,
  loadAuthSession,
  loadReportHistory,
  saveAuthSession,
} from '../lib/persistence'

const baseUser = {
  id: 'u1',
  name: 'Alex',
  fullName: 'Alex Johnson',
  email: 'alex.j@example.com',
  avatar: null,
  role: 'student',
  streak: 4,
  rank: 'Silver',
  bio: 'Senior Developer and Educator focusing on React and modern web architecture.',
  cohort: 'Fall 2024 - Web Dev',
  profile: {
    targetRole: '',
    experienceLevel: 'Beginner',
    weeklyHours: 10,
    learningStyle: '',
    contentLanguage: 'English (US)',
    focusTopics: [],
  },
  isAuthenticated: false,
}

const persistedAuth = loadAuthSession()
const initialUser = persistedAuth?.user
  ? { ...baseUser, ...persistedAuth.user, isAuthenticated: true }
  : baseUser

const useStore = create((set) => ({
  theme: 'Dark',
  setTheme: (theme) => set({ theme }),

  user: initialUser,
  setUser: (userData) =>
    set((state) => {
      const user = { ...state.user, ...userData }
      if (user.isAuthenticated) {
        saveAuthSession({
          accessToken: loadAuthSession()?.accessToken || null,
          user,
        })
      }
      return { user }
    }),
  setAuthSession: ({ user, accessToken }) =>
    set((state) => {
      const mergedUser = { ...state.user, ...user, isAuthenticated: true }
      saveAuthSession({ accessToken: accessToken || null, user: mergedUser })
      return { user: mergedUser }
    }),
  login: (userData, accessToken = null) =>
    set((state) => {
      const user = { ...state.user, ...userData, isAuthenticated: true }
      saveAuthSession({
        accessToken: accessToken ?? loadAuthSession()?.accessToken ?? null,
        user,
      })
      return { user }
    }),
  logout: () =>
    set(() => {
      clearAuthSession()
      return { user: { ...baseUser } }
    }),

  latestQuiz: {
    sessionId: null,
    result: null,
  },
  setLatestQuiz: (sessionId, result) =>
    set(() => ({
      latestQuiz: { sessionId, result },
    })),
  clearLatestQuiz: () =>
    set(() => ({
      latestQuiz: { sessionId: null, result: null },
    })),

  reportHistory: loadReportHistory(),
  setReportHistory: (reportHistory) =>
    set(() => ({
      reportHistory: Array.isArray(reportHistory) ? reportHistory : [],
    })),
  addReportHistory: (entry) =>
    set(() => ({
      reportHistory: appendReportHistory(entry),
    })),

  progress: {
    planCompletion: 68,
    planCompletionDelta: 12,
    timeSpent: { hours: 42, minutes: 15 },
    timeSpentDelta: '5h above target',
    quizAverage: 85,
    weeklyGoals: { completed: 4, total: 5 },
    weeklyData: [
      { week: 'Week 1', score: 65 },
      { week: 'Week 2', score: 70 },
      { week: 'Week 3', score: 68 },
      { week: 'Week 4', score: 78 },
      { week: 'Week 5', score: 85 },
    ],
    skillMastery: [
      { skill: 'JavaScript', value: 80 },
      { skill: 'CSS', value: 75 },
      { skill: 'React', value: 90 },
      { skill: 'Node.js', value: 60 },
      { skill: 'HTML', value: 70 },
      { skill: 'State Mgmt', value: 55 },
    ],
    heatmap: [
      [2, 0, 3, 4, 0, 0, 3],
      [0, 3, 4, 2, 0, 3, 4],
      [1, 0, 0, 4, 3, 0, 0],
      [5, 3, 0, 0, 3, 4, 0],
    ],
    coachingNotes: [],
  },
  setProgress: (progressData) =>
    set((state) => ({
      progress: { ...state.progress, ...progressData },
    })),

  roadmap: {
    currentModule: 3,
    modules: [
      { id: 1, title: 'React Fundamentals', subtitle: 'Module 1', status: 'completed', completion: 100 },
      { id: 2, title: 'State & Props', subtitle: 'Module 2', status: 'completed', completion: 100 },
      { id: 3, title: 'Advanced Hooks', subtitle: 'Module 3', status: 'in-progress', completion: 60 },
      { id: 4, title: 'Performance Optimization', subtitle: 'Module 4', status: 'locked', completion: 0 },
    ],
    upNext: {
      title: 'Advanced React Hooks',
      subtitle: 'Module 3 | 45 min remaining',
      progress: 60,
    },
  },
  setRoadmap: (roadmapData) =>
    set((state) => ({
      roadmap: { ...state.roadmap, ...roadmapData },
    })),

  resources: {
    saved: 12,
    filters: { topic: 'All', level: 'All', format: 'All', duration: 'All' },
    searchQuery: '',
    recommended: [
      {
        id: 'r1',
        matchScore: 98,
        type: 'Video',
        duration: '45 mins',
        title: 'Advanced React Patterns',
        description: 'Deep dive into render props, HOCs, and custom hooks for scalable applications.',
        tags: ['Advanced', 'React'],
        url: 'https://www.youtube.com/watch?v=J-g9ZJha8FE',
      },
      {
        id: 'r2',
        matchScore: 95,
        type: 'Article',
        duration: '15 mins',
        title: 'When to useMemo vs useCallback',
        description: 'A practical guide to performance optimization in modern React applications.',
        tags: ['Intermediate', 'Performance'],
        url: 'https://react.dev/reference/react/useMemo',
      },
      {
        id: 'r3',
        matchScore: 92,
        type: 'Interactive',
        duration: '60 mins',
        title: 'Build a Custom Hook from Scratch',
        description: 'Interactive exercise to build a useFetch hook with caching and error handling.',
        tags: ['Intermediate', 'Practice'],
        url: 'https://www.freecodecamp.org/news/how-to-create-react-hooks/',
      },
    ],
    allResources: [
      { id: 'r4', type: 'video', title: 'React Router v6 Crash Course', description: 'Complete guide to routing in modern React applications including nested routes and loaders.', duration: '35m', level: 'Beginner', url: 'https://reactrouter.com/en/main/start/tutorial' },
      { id: 'r5', type: 'article', title: 'Understanding React Context', description: 'When and how to use the Context API effectively for state management without prop drilling.', duration: '12m read', level: 'Intermediate', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
      { id: 'r6', type: 'video', title: 'TypeScript with React - Full Course', description: 'Type-safe React components, hooks and API calls using TypeScript generics.', duration: '2h 10m', level: 'Intermediate', url: 'https://www.typescriptlang.org/docs/handbook/react.html' },
      { id: 'r7', type: 'interactive', title: 'Build a Custom useFetch Hook', description: 'Step-by-step interactive exercise: build a production-ready data-fetching hook with caching.', duration: '45m', level: 'Advanced', url: 'https://www.freecodecamp.org/news/how-to-create-react-hooks/' },
      { id: 'r8', type: 'article', title: 'CSS Grid vs Flexbox: Decision Guide', description: 'A visual, practical breakdown of when to use Grid and when to use Flexbox for layouts.', duration: '8m read', level: 'Beginner', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids' },
      { id: 'r9', type: 'project', title: 'Build a Full-Stack Next.js App', description: 'End-to-end project: authentication, database, API routes, and deployment on Vercel.', duration: '5h project', level: 'Advanced', url: 'https://nextjs.org/learn' },
      { id: 'r10', type: 'video', title: 'Zustand State Management Deep Dive', description: 'Everything you need to know about Zustand: slices, middleware, devtools, and persistence.', duration: '55m', level: 'Intermediate', url: 'https://github.com/pmndrs/zustand' },
      { id: 'r11', type: 'article', title: 'Web Accessibility (a11y) for React Devs', description: 'ARIA roles, keyboard navigation, screen readers - a complete practical guide.', duration: '15m read', level: 'Intermediate', url: 'https://developer.mozilla.org/en-US/docs/Learn/Accessibility' },
    ],
    analytics: { react: 12, js: 8, css: 5, other: 3, total: 28 },
    analyticsBreakdown: [
      { name: 'React', value: 12 },
      { name: 'JS', value: 8 },
      { name: 'CSS', value: 5 },
      { name: 'Other', value: 3 },
    ],
    topics: [
      { name: 'React', count: 12 },
      { name: 'TypeScript', count: 8 },
      { name: 'Next.js', count: 5 },
      { name: 'CSS', count: 3 },
    ],
  },
  setResources: (resourcesData) =>
    set((state) => ({
      resources: { ...state.resources, ...resourcesData },
    })),
  setResourceFilter: (key, value) =>
    set((state) => ({
      resources: {
        ...state.resources,
        filters: { ...state.resources.filters, [key]: value },
      },
    })),

  onboarding: {
    currentStep: 1,
    totalSteps: 3,
    goals: {
      targetRole: 'Software Engineer',
      skills: ['React & Next.js', 'TypeScript'],
      weeklyHours: 15,
      timeframe: '6 Months',
      learningStyle: '',
      contentLanguage: '',
    },
    quiz: {
      answers: {},
      confidence: {},
      timer: 0,
      isPaused: false,
      sessionId: null,
      result: null,
    },
    plan: {
      detectedLevel: 'Intermediate React',
      scores: { coreConcepts: 85, stateMgmt: 40, perfOptimization: 25 },
      selectedTrack: 'Advanced React Patterns & Performance',
      pace: 'Standard',
    },
  },
  setOnboardingStep: (step) =>
    set((state) => ({
      onboarding: { ...state.onboarding, currentStep: step },
    })),
  setOnboardingGoals: (goals) =>
    set((state) => ({
      onboarding: { ...state.onboarding, goals: { ...state.onboarding.goals, ...goals } },
    })),
  setOnboardingQuiz: (quizData) =>
    set((state) => ({
      onboarding: { ...state.onboarding, quiz: { ...state.onboarding.quiz, ...quizData } },
    })),
  setOnboardingPlan: (plan) =>
    set((state) => ({
      onboarding: { ...state.onboarding, plan: { ...state.onboarding.plan, ...plan } },
    })),

  tasks: [
    { id: 't1', title: 'Review Custom Hooks', detail: 'Completed 2 hours ago', done: true, required: false },
    { id: 't2', title: 'Complete Hooks Quiz', detail: '15 questions | Est. 20 mins', done: false, required: true },
    { id: 't3', title: 'Read: Context API vs Redux', detail: 'Supplementary material', done: false, required: false },
  ],
  setTasks: (tasks) =>
    set(() => ({
      tasks: Array.isArray(tasks) ? tasks : [],
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    })),
}))

export default useStore
