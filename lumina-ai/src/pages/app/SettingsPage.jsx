import React, { useState } from 'react'
import useStore from '../../store/useStore'

const NAV = [
  { id: 'profile',       icon: 'fa-regular fa-user',         label: 'Profile & Account' },
  { id: 'security',      icon: 'fa-solid fa-shield-halved',  label: 'Security & Password' },
  { id: 'notifications', icon: 'fa-regular fa-bell',         label: 'Notifications' },
  { id: 'billing',       icon: 'fa-regular fa-credit-card',  label: 'Billing & Plan' },
  { id: 'integrations',  icon: 'fa-solid fa-plug',           label: 'Integrations' },
  { id: 'preferences',   icon: 'fa-solid fa-sliders',        label: 'Preferences' },
]

/* ── reusable toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-block cursor-pointer" style={{ width: 44, height: 24 }}>
    <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    <span className="absolute inset-0 rounded-full transition-all duration-300"
      style={{ background: checked ? '#3b82f6' : 'rgba(15,23,42,0.6)', border: `1px solid ${checked ? '#3b82f6' : 'rgba(255,255,255,0.2)'}` }} />
    <span className="absolute top-[3px] rounded-full bg-white transition-all duration-300"
      style={{ width: 18, height: 18, left: checked ? 23 : 3 }} />
  </label>
)

/* ── section card wrapper ── */
const Card = ({ children }) => (
  <div className="glass-panel rounded-[16px] p-6 flex flex-col gap-6" style={{ border: '1px solid rgba(51,65,85,0.5)' }}>
    {children}
  </div>
)

const SectionHeader = ({ title, sub }) => (
  <div>
    <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
    <p className="text-sm" style={{ color: '#94a3b8' }}>{sub}</p>
  </div>
)

const Divider = () => <div style={{ borderTop: '1px solid #1e293b' }} />

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{label}</label>
    {children}
  </div>
)

const Input = (props) => (
  <input {...props} className="input-field h-10 px-3 rounded-md text-sm" style={{ color: '#e2e8f0' }} />
)

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className="input-field h-10 px-3 rounded-md text-sm appearance-none w-full cursor-pointer" style={{ color: '#e2e8f0', background: 'rgba(15,23,42,0.6)' }}>
      {children}
    </select>
    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: '#64748b' }} />
  </div>
)

const SaveBtn = ({ label = 'Save Changes', onClick }) => (
  <div className="flex justify-end pt-4 mt-2" style={{ borderTop: '1px solid #1e293b' }}>
    <button onClick={onClick} className="primary-btn h-10 px-6 rounded-md text-sm font-medium text-white">
      {label}
    </button>
  </div>
)

const ToggleRow = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm" style={{ color: '#cbd5e1' }}>{label}</p>
      <p className="text-xs" style={{ color: '#64748b' }}>{sub}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
)

/* ════════════════════════════════════════════ */
export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)

  // Global toast
  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }
  /* profile */
  const [firstName, setFirstName] = useState('Alex')
  const [lastName, setLastName]   = useState('Johnson')
  const [email, setEmail]         = useState('alex.j@example.com')
  const [bio, setBio]             = useState('Senior Developer and Educator focusing on React and modern web architecture.')

  /* security */
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [twoFA, setTwoFA]             = useState(false)

  /* notifications */
  const [notifs, setNotifs] = useState({ email: true, push: false, digest: true, mentor: true, achievements: true })
  const toggleNotif = k => setNotifs(p => ({ ...p, [k]: !p[k] }))

  /* preferences */
  const [reduceMotion, setReduceMotion]   = useState(false)
  const [highContrast, setHighContrast]   = useState(false)
  const [language, setLanguage]           = useState('English (US)')
  const [timezone, setTimezone]           = useState('Pacific Time (PT) - UTC-8')

  /* integrations */
  const [ghConnected, setGhConnected]     = useState(true)
  const [slackConnected, setSlackConnected] = useState(false)
  const [calConnected, setCalConnected]   = useState(false)

  const themeOptions = [
    { id: 'Light',  icon: 'fa-regular fa-sun' },
    { id: 'Dark',   icon: 'fa-regular fa-moon' },
    { id: 'System', icon: 'fa-solid fa-desktop' },
  ]

  const renderContent = () => {
    switch (active) {

      /* ── PROFILE ─────────────────────────── */
      case 'profile': return (
        <Card>
          <SectionHeader title="Profile Details" sub="Update your personal information and public profile." />
          <div className="flex items-center gap-6 pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: '2px solid #334155', background: '#1e293b' }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => showToast('Click \'Upload New\' to choose a photo (file picker requires backend)')}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
                style={{ background: '#2563eb', border: '2px solid #0f172a' }}>
                <i className="fa-solid fa-camera text-xs" />
              </button>
            </div>
            <div>
              <div className="flex gap-3 mb-2">
                <button onClick={() => showToast('Photo upload requires backend storage')} className="secondary-btn h-9 px-4 rounded-md text-sm font-medium" style={{ color: '#e2e8f0' }}>Upload New</button>
                <button onClick={() => showToast('Profile photo removed')} className="h-9 px-4 rounded-md text-sm font-medium transition-colors hover:bg-red-900/20" style={{ color: '#f87171' }}>Remove</button>
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>Recommended: Square JPG, PNG, or GIF, at least 1,000 pixels per side.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="First Name"><Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} /></Field>
            <Field label="Last Name"><Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} /></Field>
            <div className="md:col-span-2">
              <Field label="Email Address">
                <div className="relative">
                  <i className="fa-regular fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#64748b' }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field h-10 pl-9 pr-3 rounded-md text-sm w-full" style={{ color: '#e2e8f0' }} />
                </div>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Bio">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input-field p-3 rounded-md text-sm w-full resize-none" style={{ color: '#e2e8f0' }} />
              </Field>
            </div>
          </div>
          <SaveBtn onClick={() => showToast('Profile saved successfully!')} />
        </Card>
      )

      /* ── SECURITY ────────────────────────── */
      case 'security': return (
        <Card>
          <SectionHeader title="Security & Password" sub="Manage your password and account security settings." />
          <div className="flex flex-col gap-4">
            <Field label="Current Password"><Input type="password" placeholder="••••••••" value={currentPass} onChange={e => setCurrentPass(e.target.value)} /></Field>
            <Field label="New Password"><Input type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} /></Field>
            <Field label="Confirm New Password"><Input type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} /></Field>
          </div>
          <Divider />
          <ToggleRow label="Two-Factor Authentication" sub="Add an extra layer of security to your account." checked={twoFA} onChange={() => setTwoFA(!twoFA)} />
          {twoFA && (
            <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}>
              <i className="fa-solid fa-shield-check mr-2" />
              Two-factor authentication is enabled. Your account is more secure.
            </div>
          )}
          <SaveBtn label="Update Password" onClick={() => {
            if (!currentPass) { showToast('Enter your current password', 'error'); return }
            if (!newPass) { showToast('Enter a new password', 'error'); return }
            if (newPass !== confirmPass) { showToast('Passwords do not match', 'error'); return }
            setCurrentPass(''); setNewPass(''); setConfirmPass('')
            showToast('Password updated successfully!')
          }} />
        </Card>
      )

      /* ── NOTIFICATIONS ───────────────────── */
      case 'notifications': return (
        <Card>
          <SectionHeader title="Notifications" sub="Choose what you want to be notified about." />
          <div className="flex flex-col gap-5">
            {[
              { k: 'email',        label: 'Email Notifications',  sub: 'Receive learning updates and announcements via email.' },
              { k: 'push',         label: 'Push Notifications',   sub: 'Browser push notifications for real-time alerts.' },
              { k: 'digest',       label: 'Weekly Digest',        sub: 'A weekly summary of your progress and upcoming tasks.' },
              { k: 'mentor',       label: 'Mentor Messages',      sub: 'Notifications when your mentor leaves a note or feedback.' },
              { k: 'achievements', label: 'Achievements & Badges', sub: 'Be notified when you earn a badge or milestone.' },
            ].map(({ k, label, sub }) => (
              <ToggleRow key={k} label={label} sub={sub} checked={notifs[k]} onChange={() => toggleNotif(k)} />
            ))}
          </div>
          <SaveBtn label="Save Preferences" onClick={() => showToast('Notification preferences saved!')} />
        </Card>
      )

      /* ── BILLING ─────────────────────────── */
      case 'billing': return (
        <Card>
          <SectionHeader title="Billing & Plan" sub="Manage your subscription and payment details." />
          {/* Current Plan */}
          <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Current Plan</p>
              <h3 className="text-xl font-bold text-white">Bootcamp Pro</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>$49/month · Renews June 24, 2024</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>Active</span>
          </div>
          <Divider />
          {/* Payment Method */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Payment Method</h3>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded flex items-center justify-center text-blue-400" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <i className="fa-brands fa-cc-visa text-lg" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Visa ending in 4242</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Expires 12/26</p>
                </div>
              </div>
              <button onClick={() => showToast('Payment method change requires backend')} className="text-xs text-blue-400 hover:text-blue-300">Change</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => showToast('Plan cancellation requires account verification', 'error')} className="secondary-btn h-10 px-5 rounded-md text-sm font-medium flex-1" style={{ color: '#e2e8f0' }}>Cancel Plan</button>
            <button onClick={() => showToast('Redirecting to upgrade page…')} className="primary-btn h-10 px-5 rounded-md text-sm font-medium text-white flex-1">Upgrade Plan</button>
          </div>
        </Card>
      )

      /* ── INTEGRATIONS ────────────────────── */
      case 'integrations': return (
        <Card>
          <SectionHeader title="Integrations" sub="Connect third-party services to enhance your learning experience." />
          <div className="flex flex-col gap-4">
            {[
              { icon: 'fa-brands fa-github', name: 'GitHub', desc: 'Sync your repositories and track coding activity.', connected: ghConnected, toggle: () => setGhConnected(p => !p), color: '#e2e8f0' },
              { icon: 'fa-brands fa-slack',  name: 'Slack',  desc: 'Receive learning reminders in your Slack workspace.', connected: slackConnected, toggle: () => setSlackConnected(p => !p), color: '#4ade80' },
              { icon: 'fa-regular fa-calendar', name: 'Google Calendar', desc: 'Sync your learning schedule with Google Calendar.', connected: calConnected, toggle: () => setCalConnected(p => !p), color: '#60a5fa' },
            ].map(int => (
              <div key={int.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#1e293b', border: '1px solid #334155', color: int.color }}>
                    <i className={int.icon} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{int.name}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{int.desc}</p>
                  </div>
                </div>
                <button onClick={int.toggle} className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{ background: int.connected ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${int.connected ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`, color: int.connected ? '#f87171' : '#60a5fa' }}>
                  {int.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )

      /* ── PREFERENCES ─────────────────────── */
      case 'preferences': return (
        <Card>
          <SectionHeader title="App Preferences" sub="Customize your workspace experience." />
          {/* Theme Toggle */}
          <div className="flex items-center justify-between pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Appearance</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Select your preferred theme for the interface.</p>
            </div>
            <div className="flex p-1 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}>
              {themeOptions.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all"
                  style={{
                    background: theme === t.id ? '#1e293b' : 'transparent',
                    border: theme === t.id ? '1px solid #334155' : '1px solid transparent',
                    color: theme === t.id ? '#60a5fa' : '#94a3b8',
                    boxShadow: theme === t.id ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}>
                  <i className={t.icon} /> {t.id}
                </button>
              ))}
            </div>
          </div>
          {/* Language & Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
            <Field label="Language">
              <Select value={language} onChange={e => setLanguage(e.target.value)}>
                <option style={{ background: '#1e293b' }}>English (US)</option>
                <option style={{ background: '#1e293b' }}>Spanish</option>
                <option style={{ background: '#1e293b' }}>French</option>
                <option style={{ background: '#1e293b' }}>German</option>
              </Select>
            </Field>
            <Field label="Timezone">
              <Select value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option style={{ background: '#1e293b' }}>Pacific Time (PT) - UTC-8</option>
                <option style={{ background: '#1e293b' }}>Eastern Time (ET) - UTC-5</option>
                <option style={{ background: '#1e293b' }}>Coordinated Universal Time (UTC)</option>
                <option style={{ background: '#1e293b' }}>Central European Time (CET) - UTC+1</option>
              </Select>
            </Field>
          </div>
          {/* Accessibility */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-white">Accessibility</h3>
            <ToggleRow label="Reduce Motion" sub="Minimize animations and transitions throughout the app." checked={reduceMotion} onChange={() => setReduceMotion(p => !p)} />
            <ToggleRow label="High Contrast Text" sub="Increase contrast for better readability." checked={highContrast} onChange={() => setHighContrast(p => !p)} />
          </div>
          <SaveBtn label="Save Preferences" onClick={() => showToast('Preferences saved!')} />
        </Card>
      )

      default: return null
    }
  }

  return (
    <main id="settings_main" className="flex-1 w-full max-w-[1440px] mx-auto relative z-10 px-6 py-8 overflow-y-auto flex flex-col md:flex-row gap-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-fade-in"
          style={{
            background: toast.type === 'error' ? 'rgba(30,10,10,0.96)' : 'rgba(30,41,59,0.95)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
            backdropFilter: 'blur(12px)', color: 'white'
          }}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-check text-blue-400'}`} />
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* ── SIDEBAR ────────────────────────── */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Manage your account preferences</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(n => {
            const isActive = active === n.id
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                className="px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all text-left"
                style={{
                  background: isActive ? 'rgba(30,58,138,0.3)' : 'transparent',
                  border: isActive ? '1px solid rgba(30,64,175,0.5)' : '1px solid transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                }}>
                <i className={`${n.icon} w-5 text-center`} />
                {n.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── CONTENT ────────────────────────── */}
      <div className="flex-1 flex flex-col gap-8 max-w-4xl">
        {renderContent()}
      </div>
    </main>
  )
}
