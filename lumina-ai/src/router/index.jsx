import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from '../store/useStore'

// Layouts
import AuthLayout from '../layouts/AuthLayout'
import OnboardingLayout from '../layouts/OnboardingLayout'
import AppLayout from '../layouts/AppLayout'

// Auth Pages
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'

// Onboarding Pages
import GoalsStep from '../pages/onboarding/GoalsStep'
import QuizStep from '../pages/onboarding/QuizStep'
import PlanStep from '../pages/onboarding/PlanStep'

// App Pages
import DashboardPage from '../pages/app/DashboardPage'
import AdaptiveQuizPage from '../pages/app/AdaptiveQuizPage'
import ResourcesPage from '../pages/app/ResourcesPage'
import ProgressPage from '../pages/app/ProgressPage'
import LearningPathPage from '../pages/app/LearningPathPage'
import AgentDashboard from '../pages/app/AgentDashboard'
import AdminPage from '../pages/app/AdminPage'
import SettingsPage from '../pages/app/SettingsPage'

// ─── 404 Page ─────────────────────────────────
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
    style={{ background: '#0f172a', color: '#e2e8f0' }}>
    <div className="text-[120px] font-black leading-none mb-4" style={{ color: '#1e293b' }}>404</div>
    <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
    <p className="text-sm mb-8 max-w-xs" style={{ color: '#94a3b8' }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <a href="/dashboard"
      className="primary-btn px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2">
      <i className="fa-solid fa-house text-xs" /> Back to Dashboard
    </a>
  </div>
)

// ─── Protected Route ──────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useStore(s => s.user.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// ─── Admin Route ───────────────────────────────
// Blocks non-admin users from accessing /admin
const AdminRoute = ({ children }) => {
  const user = useStore(s => s.user)
  if (!user.isAuthenticated) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

// ─── Public Route (redirect if logged in) ─────
const PublicRoute = ({ children }) => {
  const isAuthenticated = useStore(s => s.user.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// ─── Router Definition ────────────────────────
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes — redirect to dashboard if already logged in */}
        <Route element={<AuthLayout />}>
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        </Route>

        {/* Onboarding Routes */}
        <Route element={<OnboardingLayout />}>
          <Route path="/onboarding/goals" element={<GoalsStep />} />
          <Route path="/onboarding/quiz"  element={<QuizStep />} />
          <Route path="/onboarding/plan"  element={<PlanStep />} />
        </Route>

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/quiz-checkin" element={<AdaptiveQuizPage />} />
          <Route path="/agents" element={<AgentDashboard />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/progress"  element={<ProgressPage />} />
          <Route path="/learning-path" element={<LearningPathPage />} />
          <Route path="/admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
