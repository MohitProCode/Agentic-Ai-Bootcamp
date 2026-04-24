import React, { useEffect, useState, useRef } from 'react'
import { Outlet, Link, useLocation, NavLink, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'

const AppLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useStore(s => s.theme)
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)

  const isAdmin = user.role === 'admin'

  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifRead, setNotifRead] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Apply data-theme globally
  useEffect(() => {
    const resolved = theme === 'System'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'Light' : 'Dark')
      : theme
    document.documentElement.setAttribute('data-theme', resolved)
  }, [theme])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setShowProfile(false)
    navigate('/login')
  }

  // Nav links — Admin Panel only shows for admins
  const navLinks = [
    { to: '/dashboard', label: 'Main Dashboard' },
    { to: '/resources',  label: 'Resources' },
    { to: '/progress',   label: 'Progress Tracking' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', adminOnly: true }] : []),
    { to: '/settings',   label: 'Settings' },
  ]

  const notifications = [
    { id: 1, icon: 'fa-solid fa-graduation-cap', color: '#3b82f6', title: 'New lesson available', sub: 'Advanced Hooks deep-dive added', time: '5m ago' },
    { id: 2, icon: 'fa-solid fa-trophy',         color: '#f59e0b', title: 'Achievement unlocked!', sub: 'You completed Module 3', time: '1h ago' },
    { id: 3, icon: 'fa-solid fa-comment',         color: '#10b981', title: 'Mentor left a note', sub: 'Sarah Jenkins reviewed your quiz', time: '3h ago' },
  ]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0f172a' }}>
      {/* Ambient Glows */}
      <div className="ambient-glow" style={{ top: '-200px', left: '-100px' }} />
      <div className="ambient-glow" style={{ bottom: '-300px', right: '-100px', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(15,23,42,0) 70%)' }} />

      {/* ── GLOBAL HEADER ─── */}
      <header id="global_header" className="w-full border-b sticky top-0 z-50"
        style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#2563eb' }}>
                <i className="fa-solid fa-graduation-cap text-white text-sm" />
              </div>
              <span className="font-semibold text-white tracking-tight">Lumina AI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 h-full">
              {navLinks.map(link => {
                const isActive = location.pathname === link.to
                return (
                  <NavLink key={link.to} to={link.to}
                    className="h-16 px-4 flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? '#fff' : '#94a3b8',
                      borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.color = '#e2e8f0')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.color = '#94a3b8')}>
                    {link.label}
                    {link.adminOnly && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ background: 'rgba(234,179,8,0.15)', color: '#fcd34d', border: '1px solid rgba(234,179,8,0.3)' }}>
                        Admin
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-3">

            {/* Role badge */}
            {isAdmin && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(234,179,8,0.12)', color: '#fcd34d', border: '1px solid rgba(234,179,8,0.25)' }}>
                <i className="fa-solid fa-shield-halved text-[10px]" />
                Admin
              </span>
            )}

            {/* Language */}
            <button className="text-sm hidden sm:flex items-center gap-1.5 transition-colors hover:text-white" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-globe" />
              <span>EN</span>
              <i className="fa-solid fa-chevron-down text-xs" />
            </button>
            <div className="w-px h-6 hidden sm:block" style={{ background: '#1e293b' }} />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); setNotifRead(true) }}
                className="w-8 h-8 rounded-full flex items-center justify-center relative transition-colors hover:text-white"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
                <i className="fa-regular fa-bell text-sm" />
                {!notifRead && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2"
                    style={{ background: '#3b82f6', borderColor: '#0f172a' }} />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                  style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid #334155', backdropFilter: 'blur(16px)' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e293b' }}>
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <button onClick={() => setNotifRead(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Mark all read</button>
                  </div>
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${n.color}18`, border: `1px solid ${n.color}30` }}>
                          <i className={`${n.icon} text-xs`} style={{ color: n.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white">{n.title}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>{n.sub}</p>
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: '#64748b' }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid #1e293b' }}>
                    <Link to="/progress" onClick={() => setShowNotifs(false)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar / Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
                className="w-8 h-8 rounded-full overflow-hidden transition-opacity hover:opacity-80"
                style={{ border: `2px solid ${isAdmin ? '#f59e0b' : '#334155'}` }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=b6e3f4`}
                  alt="Profile" className="w-full h-full object-cover" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 w-60 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                  style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid #334155', backdropFilter: 'blur(16px)' }}>
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e293b' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{user.fullName || user.name}</p>
                      {isAdmin && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ background: 'rgba(234,179,8,0.15)', color: '#fcd34d', border: '1px solid rgba(234,179,8,0.3)' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{user.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: isAdmin ? 'rgba(234,179,8,0.12)' : 'rgba(59,130,246,0.12)',
                        border: isAdmin ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(59,130,246,0.2)',
                        color: isAdmin ? '#fcd34d' : '#60a5fa'
                      }}>
                      {isAdmin ? '🛡 Administrator' : (user.cohort || 'Bootcamp Pro')}
                    </span>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: 'fa-regular fa-user',  label: 'Profile',     to: '/settings' },
                    { icon: 'fa-solid fa-sliders',  label: 'Settings',    to: '/settings' },
                    { icon: 'fa-solid fa-chart-pie', label: 'My Progress', to: '/progress' },
                    ...(isAdmin ? [{ icon: 'fa-solid fa-shield-halved', label: 'Admin Panel', to: '/admin', admin: true }] : []),
                  ].map(item => (
                    <Link key={item.label} to={item.to} onClick={() => setShowProfile(false)}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
                      style={{ color: item.admin ? '#fcd34d' : '#cbd5e1' }}>
                      <i className={`${item.icon} w-4 text-center text-sm`} style={{ color: item.admin ? '#f59e0b' : '#64748b' }} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}

                  <div style={{ borderTop: '1px solid #1e293b' }}>
                    <button onClick={handleLogout}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 transition-colors">
                      <i className="fa-solid fa-right-from-bracket w-4 text-center text-sm" style={{ color: '#f87171' }} />
                      <span className="text-sm text-red-400">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </div>

      {/* ── GLOBAL FOOTER ── */}
      <footer id="global_utility_footer" className="w-full p-6 flex justify-between items-center text-xs z-20 relative"
        style={{ background: 'rgba(15,23,42,0.5)', borderTop: '1px solid #1e293b', color: '#64748b' }}>
        <div>© 2024 Lumina AI Inc. All rights reserved.</div>
        <div className="flex gap-4">
          {['Privacy Policy', 'Terms of Service', 'Support'].map(item => (
            <a key={item} href="#" className="hover:text-slate-300 transition-colors">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default AppLayout
