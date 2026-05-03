import { useEffect, useMemo, useState } from 'react'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'
import { mapSettingsToViewModel } from '../../api/mappers'

const NAV = [
  { id: 'profile', icon: 'fa-regular fa-user', label: 'Profile & Account' },
  { id: 'security', icon: 'fa-solid fa-shield-halved', label: 'Security & Password' },
  { id: 'notifications', icon: 'fa-regular fa-bell', label: 'Notifications' },
  { id: 'billing', icon: 'fa-regular fa-credit-card', label: 'Billing & Plan' },
  { id: 'integrations', icon: 'fa-solid fa-plug', label: 'Integrations' },
  { id: 'preferences', icon: 'fa-solid fa-sliders', label: 'Preferences' },
]

const Toggle = ({ checked, onChange, disabled = false }) => (
  <label
    className={`relative inline-block ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    style={{ width: 44, height: 24 }}
  >
    <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
    <span
      className="absolute inset-0 rounded-full transition-all duration-300"
      style={{
        background: checked ? '#3b82f6' : 'rgba(15,23,42,0.6)',
        border: `1px solid ${checked ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
      }}
    />
    <span
      className="absolute top-[3px] rounded-full bg-white transition-all duration-300"
      style={{ width: 18, height: 18, left: checked ? 23 : 3 }}
    />
  </label>
)

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
    <select
      {...props}
      className="input-field h-10 px-3 rounded-md text-sm appearance-none w-full cursor-pointer"
      style={{ color: '#e2e8f0', background: 'rgba(15,23,42,0.6)' }}
    >
      {children}
    </select>
    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: '#64748b' }} />
  </div>
)

const SaveBtn = ({ label = 'Save Changes', onClick, loading = false }) => (
  <div className="flex justify-end pt-4 mt-2" style={{ borderTop: '1px solid #1e293b' }}>
    <button onClick={onClick} disabled={loading} className="primary-btn h-10 px-6 rounded-md text-sm font-medium text-white disabled:opacity-60">
      {loading ? 'Saving...' : label}
    </button>
  </div>
)

const ToggleRow = ({ label, sub, checked, onChange, disabled = false }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm" style={{ color: '#cbd5e1' }}>{label}</p>
      <p className="text-xs" style={{ color: '#64748b' }}>{sub}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} />
  </div>
)

export default function SettingsPage() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)

  const [active, setActive] = useState('profile')
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [saving, setSaving] = useState({ profile: false, notifications: false, preferences: false })

  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [twoFA, setTwoFA] = useState(false)

  const [notifs, setNotifs] = useState({
    email: true,
    push: false,
    digest: true,
    mentor: true,
    achievements: true,
  })

  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [language, setLanguage] = useState('English')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [appearance, setAppearance] = useState(theme)

  const [ghConnected, setGhConnected] = useState(true)
  const [slackConnected, setSlackConnected] = useState(false)
  const [calConnected, setCalConnected] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id || !user?.isAuthenticated) return
      setLoadingSettings(true)
      try {
        const response = await luminaApi.getSettings(user.id)
        const mapped = mapSettingsToViewModel(response, user)
        setFirstName(mapped.profile.firstName)
        setLastName(mapped.profile.lastName)
        setEmail(mapped.profile.email)
        setBio(mapped.profile.bio)
        setAvatarUrl(mapped.profile.avatarUrl)

        setLanguage(mapped.preferences.language)
        setTimezone(mapped.preferences.timezone)
        setNotifs((prev) => ({
          ...prev,
          email: mapped.preferences.notificationsEnabled,
          digest: mapped.preferences.weeklyReportEnabled,
        }))

        setAppearance(mapped.preferences.appearance)
        setTheme(mapped.preferences.appearance)
        setUser(mapped.userPatch)
      } catch (error) {
        const fallback = mapSettingsToViewModel({}, user)
        setFirstName(fallback.profile.firstName)
        setLastName(fallback.profile.lastName)
        setEmail(fallback.profile.email)
        setBio(fallback.profile.bio)
        setAvatarUrl(fallback.profile.avatarUrl)
        showToast(error?.message || 'Unable to load backend settings. Showing local values.', 'error')
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isAuthenticated])

  const isBackendAvailable = Boolean(user?.id && user?.isAuthenticated && user?.id.startsWith('user_'))

  const profilePayload = useMemo(
    () => ({
      first_name: firstName.trim() || 'Learner',
      last_name: lastName.trim() || 'User',
      email: email.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim() || undefined,
    }),
    [firstName, lastName, email, bio, avatarUrl]
  )

  const saveProfile = async () => {
    if (!profilePayload.email) {
      showToast('Email is required for profile settings.', 'error')
      return
    }

    setSaving((prev) => ({ ...prev, profile: true }))
    try {
      if (isBackendAvailable) {
        await luminaApi.updateSettings(user.id, { profile: profilePayload })
      }
      const fullName = `${profilePayload.first_name} ${profilePayload.last_name}`.trim()
      setUser({
        name: profilePayload.first_name,
        fullName,
        email: profilePayload.email,
        bio: profilePayload.bio,
        avatar: profilePayload.avatar_url || user?.avatar || null,
      })
      showToast(isBackendAvailable ? 'Profile saved successfully!' : 'Profile saved locally for this demo user.')
    } catch (error) {
      showToast(error?.message || 'Unable to save profile right now.', 'error')
    } finally {
      setSaving((prev) => ({ ...prev, profile: false }))
    }
  }

  const saveNotifications = async () => {
    setSaving((prev) => ({ ...prev, notifications: true }))
    try {
      if (isBackendAvailable) {
        await luminaApi.updateSettings(user.id, {
          preferences: {
            notifications_enabled: notifs.email,
            weekly_report_enabled: notifs.digest,
          },
        })
      }
      showToast(isBackendAvailable ? 'Notification preferences saved!' : 'Notification preferences saved locally.')
    } catch (error) {
      showToast(error?.message || 'Unable to save notifications right now.', 'error')
    } finally {
      setSaving((prev) => ({ ...prev, notifications: false }))
    }
  }

  const savePreferences = async () => {
    setSaving((prev) => ({ ...prev, preferences: true }))
    try {
      if (isBackendAvailable) {
        await luminaApi.updateSettings(user.id, {
          preferences: {
            language,
            timezone,
            notifications_enabled: notifs.email,
            weekly_report_enabled: notifs.digest,
            appearance,
          },
        })
      }
      setTheme(appearance)
      showToast(isBackendAvailable ? 'Preferences saved!' : 'Preferences saved locally.')
    } catch (error) {
      showToast(error?.message || 'Unable to save preferences right now.', 'error')
    } finally {
      setSaving((prev) => ({ ...prev, preferences: false }))
    }
  }

  const renderContent = () => {
    switch (active) {
      case 'profile':
        return (
          <Card>
            <SectionHeader title="Profile Details" sub="Update your personal information and public profile." />
            <div className="flex items-center gap-6 pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: '2px solid #334155', background: '#1e293b' }}>
                  <img
                    src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName || 'Learner'}&backgroundColor=b6e3f4`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Field label="Avatar URL">
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="First Name"><Input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></Field>
              <Field label="Last Name"><Input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} /></Field>
              <div className="md:col-span-2">
                <Field label="Email Address">
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Bio">
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={3}
                    className="input-field p-3 rounded-md text-sm w-full resize-none"
                    style={{ color: '#e2e8f0' }}
                  />
                </Field>
              </div>
            </div>
            <SaveBtn onClick={saveProfile} loading={saving.profile} />
          </Card>
        )

      case 'security':
        return (
          <Card>
            <SectionHeader title="Security & Password" sub="Manage your password and account security settings." />
            <div className="flex flex-col gap-4">
              <Field label="Current Password"><Input type="password" placeholder="********" value={currentPass} onChange={(event) => setCurrentPass(event.target.value)} /></Field>
              <Field label="New Password"><Input type="password" placeholder="********" value={newPass} onChange={(event) => setNewPass(event.target.value)} /></Field>
              <Field label="Confirm New Password"><Input type="password" placeholder="********" value={confirmPass} onChange={(event) => setConfirmPass(event.target.value)} /></Field>
            </div>
            <Divider />
            <ToggleRow label="Two-Factor Authentication" sub="Add an extra layer of security to your account." checked={twoFA} onChange={() => setTwoFA(!twoFA)} />
            <SaveBtn
              label="Update Password"
              onClick={() => {
                if (!currentPass || !newPass || !confirmPass) {
                  showToast('Please complete all password fields.', 'error')
                  return
                }
                if (newPass !== confirmPass) {
                  showToast('Passwords do not match.', 'error')
                  return
                }
                setCurrentPass('')
                setNewPass('')
                setConfirmPass('')
                showToast('Password change recorded. Backend reset flow is coming next.')
              }}
            />
          </Card>
        )

      case 'notifications':
        return (
          <Card>
            <SectionHeader title="Notifications" sub="Choose what you want to be notified about." />
            <div className="flex flex-col gap-5">
              <ToggleRow label="Email Notifications" sub="Receive learning updates and announcements via email." checked={notifs.email} onChange={() => setNotifs((prev) => ({ ...prev, email: !prev.email }))} />
              <ToggleRow label="Push Notifications" sub="Browser push notifications for real-time alerts." checked={notifs.push} onChange={() => setNotifs((prev) => ({ ...prev, push: !prev.push }))} />
              <ToggleRow label="Weekly Digest" sub="A weekly summary of your progress and upcoming tasks." checked={notifs.digest} onChange={() => setNotifs((prev) => ({ ...prev, digest: !prev.digest }))} />
              <ToggleRow label="Mentor Messages" sub="Notifications when your mentor leaves a note or feedback." checked={notifs.mentor} onChange={() => setNotifs((prev) => ({ ...prev, mentor: !prev.mentor }))} />
              <ToggleRow label="Achievements & Badges" sub="Be notified when you earn a badge or milestone." checked={notifs.achievements} onChange={() => setNotifs((prev) => ({ ...prev, achievements: !prev.achievements }))} />
            </div>
            <SaveBtn label="Save Preferences" onClick={saveNotifications} loading={saving.notifications} />
          </Card>
        )

      case 'billing':
        return (
          <Card>
            <SectionHeader title="Billing & Plan" sub="Manage your subscription and payment details." />
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Current Plan</p>
                <h3 className="text-xl font-bold text-white">Bootcamp Pro</h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>$49/month | Auto-renew enabled</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>Active</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => showToast('Billing management will be connected to your payment provider soon.')} className="secondary-btn h-10 px-5 rounded-md text-sm font-medium flex-1" style={{ color: '#e2e8f0' }}>Manage Billing</button>
              <button onClick={() => showToast('Upgrade flow ready in next backend iteration.')} className="primary-btn h-10 px-5 rounded-md text-sm font-medium text-white flex-1">Upgrade Plan</button>
            </div>
          </Card>
        )

      case 'integrations':
        return (
          <Card>
            <SectionHeader title="Integrations" sub="Connect third-party services to enhance your learning experience." />
            <div className="flex flex-col gap-4">
              {[
                { icon: 'fa-brands fa-github', name: 'GitHub', desc: 'Sync repositories and coding activity.', connected: ghConnected, toggle: () => setGhConnected((value) => !value), color: '#e2e8f0' },
                { icon: 'fa-brands fa-slack', name: 'Slack', desc: 'Receive reminders in your workspace.', connected: slackConnected, toggle: () => setSlackConnected((value) => !value), color: '#4ade80' },
                { icon: 'fa-regular fa-calendar', name: 'Google Calendar', desc: 'Sync your weekly learning schedule.', connected: calConnected, toggle: () => setCalConnected((value) => !value), color: '#60a5fa' },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#1e293b', border: '1px solid #334155', color: integration.color }}>
                      <i className={integration.icon} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{integration.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{integration.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={integration.toggle}
                    className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{
                      background: integration.connected ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${integration.connected ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      color: integration.connected ? '#f87171' : '#60a5fa',
                    }}
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )

      case 'preferences':
        return (
          <Card>
            <SectionHeader title="App Preferences" sub="Customize your workspace experience." />
            <div className="flex items-center justify-between pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Appearance</h3>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Select your preferred theme.</p>
              </div>
              <div className="flex p-1 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}>
                {['Light', 'Dark', 'System'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setAppearance(option)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                    style={{
                      background: appearance === option ? '#1e293b' : 'transparent',
                      border: appearance === option ? '1px solid #334155' : '1px solid transparent',
                      color: appearance === option ? '#60a5fa' : '#94a3b8',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6" style={{ borderBottom: '1px solid #1e293b' }}>
              <Field label="Language">
                <Select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option style={{ background: '#1e293b' }}>English</option>
                  <option style={{ background: '#1e293b' }}>Spanish</option>
                  <option style={{ background: '#1e293b' }}>French</option>
                  <option style={{ background: '#1e293b' }}>German</option>
                </Select>
              </Field>
              <Field label="Timezone">
                <Select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                  <option style={{ background: '#1e293b' }}>Asia/Kolkata</option>
                  <option style={{ background: '#1e293b' }}>America/Los_Angeles</option>
                  <option style={{ background: '#1e293b' }}>America/New_York</option>
                  <option style={{ background: '#1e293b' }}>Europe/Berlin</option>
                </Select>
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-white">Accessibility</h3>
              <ToggleRow label="Reduce Motion" sub="Minimize animations and transitions throughout the app." checked={reduceMotion} onChange={() => setReduceMotion((value) => !value)} />
              <ToggleRow label="High Contrast Text" sub="Increase contrast for better readability." checked={highContrast} onChange={() => setHighContrast((value) => !value)} />
            </div>
            <SaveBtn label="Save Preferences" onClick={savePreferences} loading={saving.preferences} />
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <main id="settings_main" className="flex-1 w-full max-w-[1440px] mx-auto relative z-10 px-6 py-8 overflow-y-auto flex flex-col md:flex-row gap-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-fade-in"
          style={{
            background: toast.type === 'error' ? 'rgba(30,10,10,0.96)' : 'rgba(30,41,59,0.95)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
            backdropFilter: 'blur(12px)',
            color: 'white',
          }}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-check text-blue-400'}`} />
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Manage your account preferences</p>
          {loadingSettings && <p className="text-xs mt-2 text-blue-400">Loading backend settings...</p>}
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all text-left"
                style={{
                  background: isActive ? 'rgba(30,58,138,0.3)' : 'transparent',
                  border: isActive ? '1px solid rgba(30,64,175,0.5)' : '1px solid transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                }}
              >
                <i className={`${item.icon} w-5 text-center`} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col gap-8 max-w-4xl">
        {renderContent()}
      </div>
    </main>
  )
}
