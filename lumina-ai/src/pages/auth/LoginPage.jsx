import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'

// ─── Login Page ───────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate()
  const login = useStore(s => s.login)

  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [ssoMsg, setSsoMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!password.trim()) { setError('Please enter your password.'); return }
    setError('')
    // Detect admin by email for demo purposes
    const isAdmin = email.toLowerCase().includes('admin')
    login({
      name: email.split('@')[0] || 'Learner',
      email,
      role: isAdmin ? 'admin' : 'student',
      isAuthenticated: true
    })
    navigate('/dashboard')
  }

  const loginAsUser = () => {
    login({ name: 'Alex', email: 'alex.j@example.com', role: 'student', isAuthenticated: true })
    navigate('/dashboard')
  }

  const loginAsAdmin = () => {
    login({ name: 'Admin', email: 'admin@lumina.ai', role: 'admin', isAuthenticated: true })
    navigate('/dashboard')
  }

  const handleSSO = (provider) => {
    setSsoMsg(`Redirecting to ${provider}…`)
    setTimeout(() => {
      login({ name: 'Demo User', email: `demo@${provider.toLowerCase()}.com`, isAuthenticated: true })
      navigate('/dashboard')
    }, 1200)
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email above first, then click Forgot Password.'); return }
    setError('')
    setSsoMsg(`Password reset link sent to ${email}`)
  }

  return (
    <main id="split_auth_container" className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto relative z-10">

      {/* ── LEFT: Value Prop Panel ─────────────── */}
      <section id="value_prop_panel" className="hidden lg:flex w-1/2 p-12 xl:p-24 flex-col justify-center relative">
        <div className="max-w-lg">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#60a5fa' }} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-medium">Bootcamp Edition v2.0</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
            Master new skills with <br />
            <span className="gradient-text">AI-driven paths.</span>
          </h1>

          <p className="text-lg mb-12 leading-relaxed" style={{ color: '#94a3b8' }}>
            Our platform analyzes your learning style and goals to create a hyper-personalized curriculum, adapting in real-time as you progress.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: <i className="fa-solid fa-brain text-blue-400" />,
                title: 'Adaptive Algorithms',
                desc: 'Content difficulty adjusts based on your comprehension rate.'
              },
              {
                icon: <i className="fa-solid fa-chart-line text-cyan-400" />,
                title: 'Real-time Analytics',
                desc: 'Track your mastery across specific skill nodes and concepts.'
              }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155' }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">{f.title}</h3>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative progress card */}
        <div className="absolute bottom-12 right-12 w-64 h-48 glass-panel rounded-xl p-4 hidden xl:block opacity-60" style={{ transform: 'rotate(-5deg)' }}>
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>Progress Overview</div>
            <div className="text-xs font-medium text-blue-400">+14% this week</div>
          </div>
          <div className="space-y-3">
            {[['75%', '#3b82f6'], ['45%', '#67e8f9'], ['90%', '#a78bfa']].map(([w, color], i) => (
              <div key={i} className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                <div className="h-full rounded-full" style={{ width: w, background: color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RIGHT: Login Form ─────────────────── */}
      <section id="login_form_section" className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div id="login_form_card" className="w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl">

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Enter your credentials to access your learning path.</p>
          </div>

          {/* SSO Buttons */}
          <div id="sso_integration_group" className="space-y-3 mb-6">
            {ssoMsg && (
              <div className="text-center text-xs py-2 px-3 rounded-lg font-medium"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                {ssoMsg}
              </div>
            )}
            <button onClick={() => handleSSO('Google')} className="w-full sso-btn rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>
              <i className="fa-brands fa-google text-white" />
              Continue with Google
            </button>
            <button onClick={() => handleSSO('Apple')} className="w-full sso-btn rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>
              <i className="fa-brands fa-apple text-white text-lg" />
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-4 mb-2">
            <div className="flex-grow border-t" style={{ borderColor: '#334155' }} />
            <span className="flex-shrink-0 mx-4 text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Or continue with email</span>
            <div className="flex-grow border-t" style={{ borderColor: '#334155' }} />
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: '#cbd5e1' }}>Email Address</label>
              <input
                type="email" id="email"
                className="input-field rounded-lg py-2.5 px-4 text-sm"
                placeholder="name@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium" style={{ color: '#cbd5e1' }}>Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} id="password"
                  className="input-field rounded-lg py-2.5 px-4 text-sm pr-10"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#64748b' }}>
                  <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <div
                  className="w-4 h-4 rounded mr-2 flex items-center justify-center transition-colors"
                  style={{
                    border: `1px solid ${remember ? '#3b82f6' : '#475569'}`,
                    background: remember ? '#3b82f6' : 'rgba(30,41,59,0.5)'
                  }}
                >
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Remember me for 30 days</span>
              </label>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </p>
            )}
            <button type="submit" className="w-full primary-btn rounded-lg py-2.5 px-4 text-sm font-semibold text-white mt-2">
              Sign In
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: '#94a3b8' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign up for free</Link>
          </p>

          {/* ── Quick Demo Access ──────────────── */}
          <div className="mt-6">
            <div className="relative flex items-center mb-4">
              <div className="flex-grow border-t" style={{ borderColor: '#1e293b' }} />
              <span className="flex-shrink-0 mx-3 text-xs uppercase tracking-wider px-2 rounded" style={{ color: '#64748b', background: 'rgba(15,23,42,0.8)' }}>Quick Demo Access</span>
              <div className="flex-grow border-t" style={{ borderColor: '#1e293b' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={loginAsUser}
                className="flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <i className="fa-solid fa-user text-sm text-blue-400" />
                </div>
                <span>Student Login</span>
                <span className="text-[10px] opacity-60">alex.j@example.com</span>
              </button>
              <button
                onClick={loginAsAdmin}
                className="flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(234,179,8,0.3)', color: '#fcd34d' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.12)' }}>
                  <i className="fa-solid fa-shield-halved text-sm text-yellow-400" />
                </div>
                <span>Admin Login</span>
                <span className="text-[10px] opacity-60">admin@lumina.ai</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
