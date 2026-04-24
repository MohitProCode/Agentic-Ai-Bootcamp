import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'

// ─── Signup Page ──────────────────────────────
// Exact match: 9-Personalised Learning - Signup.html
const SignupPage = () => {
  const navigate = useNavigate()
  const login = useStore(s => s.login)

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', cohortCode: '', agreed: false
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [ssoMsg, setSsoMsg] = useState('')

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSignup = (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Please enter your full name.'); return }
    if (!form.email.trim()) { setError('Please enter your email address.'); return }
    if (!form.password.trim()) { setError('Please enter a password.'); return }
    if (!form.agreed) { setError('Please accept the Terms of Service.'); return }
    setError('')
    login({
      name: form.fullName.split(' ')[0] || 'User',
      fullName: form.fullName,
      email: form.email,
      cohort: form.cohortCode || 'Bootcamp Pro',
      role: 'student',
      isAuthenticated: true
    })
    navigate('/onboarding/goals')
  }

  const handleSSO = (provider) => {
    setSsoMsg(`Redirecting to ${provider}…`)
    setTimeout(() => {
      login({ name: `${provider} User`, email: `user@${provider.toLowerCase()}.com`, role: 'student', isAuthenticated: true })
      navigate('/onboarding/goals')
    }, 1200)
  }

  return (
    <main id="split_auth_container" className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto relative z-10">

      {/* ── LEFT: Value Prop Panel ─────────────── */}
      <section id="value_prop_panel" className="hidden lg:flex w-1/2 p-12 xl:p-24 flex-col justify-center relative">
        <div className="max-w-lg">

          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#60a5fa' }} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-medium">Bootcamp Excellence</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
            Start your journey with <br />
            <span className="gradient-text">Intelligent Learning.</span>
          </h1>

          <p className="text-lg mb-12 leading-relaxed" style={{ color: '#94a3b8' }}>
            Join an elite cohort of learners. Our platform builds a dynamic curriculum tailored to your exact career goals and current skill level.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: 'fa-solid fa-users',
                iconColor: '#60a5fa',
                iconBg: 'rgba(59,130,246,0.12)',
                iconBorder: 'rgba(59,130,246,0.2)',
                title: 'Cohort-based Growth',
                desc: 'Learn alongside peers in structured, high-intensity bootcamps.'
              },
              {
                icon: 'fa-solid fa-certificate',
                iconColor: '#67e8f9',
                iconBg: 'rgba(6,182,212,0.12)',
                iconBorder: 'rgba(6,182,212,0.2)',
                title: 'Industry Certification',
                desc: 'Earn verified credentials recognized by top tech employers.'
              }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}>
                  <i className={`${f.icon}`} style={{ color: f.iconColor }} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">{f.title}</h3>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Absolute decorative testimonial card */}
        <div className="absolute bottom-12 right-12 w-72 glass-panel rounded-xl p-5 hidden xl:block opacity-80"
          style={{ transform: 'rotate(-3deg)' }}>
          <div className="flex gap-3 items-center mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">S</div>
            </div>
            <div>
              <div className="text-sm text-white font-medium">Sarah Jenkins</div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Software Engineer @ TechCorp</div>
            </div>
          </div>
          <p className="text-sm italic leading-relaxed" style={{ color: '#cbd5e1' }}>
            "The personalized path completely changed how I approach learning. I mastered React 40% faster than my previous attempts."
          </p>
          <div className="flex gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <i key={i} className="fa-solid fa-star text-xs" style={{ color: '#60a5fa' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RIGHT: Signup Form ─────────────────── */}
      <section id="signup_form_section" className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div id="signup_form_card" className="w-full max-w-md glass-panel rounded-[8px] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
          style={{ border: '1px solid #334155' }}>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Create your account</h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Join Lumina AI and start your personalized path.</p>
          </div>

          {/* SSO Buttons */}
          <div id="sso_integration_group" className="space-y-3 mb-6">
            {ssoMsg && (
              <div className="text-center text-xs py-2 px-3 rounded-lg font-medium"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                {ssoMsg}
              </div>
            )}
            <button onClick={() => handleSSO('Google')}
              className="w-full sso-btn rounded-[8px] py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium"
              style={{ color: '#e2e8f0' }}>
              <i className="fa-brands fa-google text-white" />
              Sign up with Google
            </button>
            <button onClick={() => handleSSO('GitHub')}
              className="w-full sso-btn rounded-[8px] py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium"
              style={{ color: '#e2e8f0' }}>
              <i className="fa-brands fa-github text-white text-lg" />
              Sign up with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-4 mb-2">
            <div className="flex-grow border-t" style={{ borderColor: '#334155' }} />
            <span className="flex-shrink-0 mx-4 text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Or register with email</span>
            <div className="flex-grow border-t" style={{ borderColor: '#334155' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium mb-1.5" style={{ color: '#cbd5e1' }}>Full Name</label>
              <input
                type="text" id="full_name" placeholder="Jane Doe"
                value={form.fullName} onChange={e => update('fullName', e.target.value)}
                className="w-full input-field rounded-[8px] py-2.5 px-4 text-sm text-white placeholder:text-slate-600"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup_email" className="block text-xs font-medium mb-1.5" style={{ color: '#cbd5e1' }}>Email Address</label>
              <input
                type="email" id="signup_email" placeholder="name@company.com"
                value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full input-field rounded-[8px] py-2.5 px-4 text-sm text-white placeholder:text-slate-600"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup_password" className="block text-xs font-medium mb-1.5" style={{ color: '#cbd5e1' }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} id="signup_password"
                  placeholder="Create a strong password"
                  value={form.password} onChange={e => update('password', e.target.value)}
                  className="w-full input-field rounded-[8px] py-2.5 px-4 pr-10 text-sm text-white placeholder:text-slate-600"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#64748b' }}>
                  <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: '#64748b' }}>Must be at least 8 characters long.</p>
            </div>

            {/* Cohort Code */}
            <div>
              <label htmlFor="cohort_code" className="block text-xs font-medium mb-1.5" style={{ color: '#cbd5e1' }}>
                Cohort / Invite Code <span style={{ color: '#64748b' }} className="font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-ticket text-xs" style={{ color: '#64748b' }} />
                </div>
                <input
                  type="text" id="cohort_code" placeholder="e.g. BOOTCAMP-2024"
                  value={form.cohortCode} onChange={e => update('cohortCode', e.target.value)}
                  className="w-full input-field rounded-[8px] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start pt-2">
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" className="sr-only" checked={form.agreed} onChange={e => update('agreed', e.target.checked)} />
                <div className="w-4 h-4 rounded flex items-center justify-center mr-2.5 shrink-0 mt-0.5 transition-colors"
                  style={{
                    border: `1px solid ${form.agreed ? '#3b82f6' : '#475569'}`,
                    background: form.agreed ? '#3b82f6' : 'rgba(30,41,59,0.5)'
                  }}>
                  {form.agreed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                  I agree to the{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>.
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </p>
            )}

            {/* Submit */}
            <button type="submit"
              className="w-full primary-btn rounded-[8px] py-2.5 px-4 text-sm font-semibold text-white mt-2">
              Create Account
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default SignupPage
