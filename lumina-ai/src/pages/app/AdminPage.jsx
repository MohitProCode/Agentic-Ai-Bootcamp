import { useState } from 'react'
import { Search, Plus, Users, ChevronLeft, ChevronRight, Check, X, MoreHorizontal, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Avatar } from '../../components/ui/index'

const Toast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl"
    style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(59,130,246,0.4)', backdropFilter: 'blur(12px)' }}>
    <i className="fa-solid fa-circle-check text-blue-400" />{msg}
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><i className="fa-solid fa-xmark" /></button>
  </div>
)

// New Cohort modal
const NewCohortModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('')
  const [instructor, setInstructor] = useState('')
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Create New Cohort</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Cohort Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring 2025 - Web Dev"
              className="input-field h-10 px-3 rounded-md text-sm" style={{ color: '#e2e8f0' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Lead Instructor</label>
            <input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Instructor name"
              className="input-field h-10 px-3 rounded-md text-sm" style={{ color: '#e2e8f0' }} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="secondary-btn flex-1 h-10 rounded-md text-sm font-medium" style={{ color: '#e2e8f0' }}>Cancel</button>
          <button onClick={() => onSave(name || 'New Cohort')} className="primary-btn flex-1 h-10 rounded-md text-sm font-medium text-white">Create Cohort</button>
        </div>
      </div>
    </div>
  )
}

// Invite Users modal
const InviteModal = ({ onClose, onSend }) => {
  const [emails, setEmails] = useState('')
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Invite Users</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Email addresses (comma separated)</label>
          <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={3}
            placeholder="user@example.com, another@example.com"
            className="input-field p-3 rounded-md text-sm resize-none" style={{ color: '#e2e8f0' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="secondary-btn flex-1 h-10 rounded-md text-sm font-medium" style={{ color: '#e2e8f0' }}>Cancel</button>
          <button onClick={() => onSend(emails)} className="primary-btn flex-1 h-10 rounded-md text-sm font-medium text-white">Send Invites</button>
        </div>
      </div>
    </div>
  )
}

const AdminChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return <div className="custom-tooltip">{label}: {payload[0].value}</div>
  return null
}

const AdminPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [logFilter, setLogFilter] = useState('Today')
  const [toast, setToast] = useState(null)
  const [showNewCohort, setShowNewCohort] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [approvals, setApprovals] = useState([
    { id: 1, title: 'Advanced React Patterns Module', type: 'Curriculum', by: 'Maria Garcia', time: '2 hours ago', status: 'pending' },
    { id: 2, title: 'TypeScript Fundamentals Quiz', type: 'Assessment', by: 'Tom Smith', time: '5 hours ago', status: 'pending' },
  ])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const [users, setUsers] = useState([
    { id: 1, name: 'Alex Johnson', email: 'alex.j@example.com', role: 'Student', cohort: 'Fall 2024 - Web Dev', status: 'Active' },
    { id: 2, name: 'Maria Garcia', email: 'm.garcia@example.com', role: 'Instructor', cohort: 'Fall 2024 - Web Dev', status: 'Active' },
    { id: 3, name: 'Tom Smith', email: 'tom.s@example.com', role: 'Student', cohort: 'Winter 2025 - Data Sci', status: 'Pending' },
  ])

  const activityData = [
    { time: '00:00', logins: 2 }, { time: '04:00', logins: 5 }, { time: '08:00', logins: 45 },
    { time: '12:00', logins: 78 }, { time: '16:00', logins: 55 }, { time: '20:00', logins: 30 }, { time: '24:00', logins: 8 },
  ]

  const handleApprove = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
    showToast('Content approved successfully!')
  }

  const handleReject = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
    showToast('Content rejected.')
  }

  const handleActivate = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Pending' : 'Active' } : u))
    showToast('User status updated!')
  }

  const statCards = [
    { label: 'Total Cohorts', value: '24', delta: '↑ 2 new this month', deltaPos: true, icon: '🏫' },
    { label: 'Active Users', value: '1,248', delta: '↑ +15% vs last month', deltaPos: true, icon: '👥' },
    { label: 'Pending Approvals', value: approvals.filter(a => a.status === 'pending').length.toString(), delta: 'Content & Plans', deltaPos: null, icon: '📋' },
    { label: 'Active AI Plans', value: '856', delta: '↑ 42 generated today', deltaPos: true, icon: '🤖' },
  ]

  const filtered = users.filter(u => !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 flex flex-col gap-5">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {showNewCohort && <NewCohortModal onClose={() => setShowNewCohort(false)} onSave={name => { setShowNewCohort(false); showToast(`Cohort "${name}" created!`) }} />}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSend={emails => { setShowInvite(false); showToast(`Invites sent to ${emails.split(',').length} user(s)!`) }} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Manage cohorts, users, and content approvals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewCohort(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-300 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <Plus size={14} /> New Cohort
          </button>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 primary-btn">
            <Users size={14} /> Invite Users
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="glass-panel rounded-[16px] p-5 flex items-start justify-between" style={{ border: '1px solid rgba(51,65,85,0.5)' }}>
            <div>
              <p className="text-xs mb-1.5" style={{ color: '#94a3b8' }}>{card.label}</p>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className={`text-xs font-medium ${card.deltaPos === true ? 'text-emerald-400' : 'text-slate-500'}`}>{card.delta}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Table + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* User Table */}
        <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Cohort & User Management</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Search size={12} className="text-slate-500" />
                <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none w-32" />
                {searchTerm && <button onClick={() => setSearchTerm('')}><X size={11} className="text-slate-500 hover:text-white" /></button>}
              </div>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="pb-3 pr-4 w-8"><input type="checkbox" className="w-3.5 h-3.5 accent-blue-500" /></th>
                {['User / Email', 'Role', 'Cohort', 'Status', 'Actions'].map(col => (
                  <th key={col} className="pb-3 pr-4 text-left text-xs font-medium" style={{ color: '#64748b' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-4"><input type="checkbox" className="w-3.5 h-3.5 accent-blue-500" /></td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} size={28} />
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-xs px-2.5 py-1 rounded-md font-medium"
                      style={{ background: user.role === 'Instructor' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${user.role === 'Instructor' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)'}`, color: user.role === 'Instructor' ? '#60a5fa' : '#94a3b8' }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-sm" style={{ color: '#cbd5e1' }}>{user.cohort}</td>
                  <td className="py-3.5 pr-4">
                    <button onClick={() => handleActivate(user.id)} className="flex items-center gap-1.5 transition-colors hover:opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: user.status === 'Active' ? '#10b981' : '#64748b' }} />
                      <span className={`text-xs ${user.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`}>{user.status}</span>
                    </button>
                  </td>
                  <td className="py-3.5">
                    <button onClick={() => showToast(`Viewing profile: ${user.name}`)} className="transition-colors hover:text-slate-300" style={{ color: '#64748b' }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-sm" style={{ color: '#64748b' }}>No users match your search.</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs" style={{ color: '#64748b' }}>Showing {filtered.length} of 1,248 entries</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/5 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronLeft size={13} />
              </button>
              {[1, 2, 3].map(p => (
                <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                  style={{ background: page === p ? '#3b82f6' : 'transparent', border: `1px solid ${page === p ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, color: page === p ? 'white' : '#94a3b8' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => p + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/5 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Activity + Templates */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">System Activity Logs</h2>
              <div className="relative">
                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #334155' }}
                  className="text-xs text-slate-300 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer">
                  {['Today', 'This Week', 'This Month'].map(o => <option key={o} style={{ background: '#0f172a' }}>{o}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AdminChartTooltip />} />
                  <Area type="monotone" dataKey="logins" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              {[{ dot: '#3b82f6', label: 'User Logins', time: '10 mins ago' }, { dot: '#475569', label: 'Settings Changed', time: '1 hour ago' }].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: item.dot }} /><span className="text-xs" style={{ color: '#94a3b8' }}>{item.label}</span></div>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">AI Plan Templates</h2>
              <button onClick={() => showToast('New template wizard coming soon!')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                <Plus size={11} />New
              </button>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-white">Frontend Developer Path</p>
                <span className="text-[10px]" style={{ color: '#64748b' }}>v2.1</span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#64748b' }}>Standard template for aspiring frontend developers focusing on React, CSS architecture, and testing.</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-blue-300" style={{ background: 'rgba(59,130,246,0.12)' }}>432 Active Uses</span>
                <button onClick={() => showToast('Template duplicated!')} className="text-xs text-slate-400 hover:text-white transition-colors">Duplicate</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="glass-panel rounded-[16px] border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Content Approval Queue</h2>
          <button onClick={() => showToast('Showing full approval queue')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View All Queue</button>
        </div>
        <div className="flex flex-col gap-3">
          {approvals.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${item.status === 'approved' ? 'rgba(16,185,129,0.2)' : item.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}><span className="text-sm">📘</span></div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{item.type}</span>
                    {item.status !== 'pending' && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium"
                        style={{ background: item.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: item.status === 'approved' ? '#4ade80' : '#f87171' }}>
                        {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: '#64748b' }}>Submitted by {item.by} • {item.time}</p>
                </div>
              </div>
              {item.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Check size={14} className="text-emerald-400" />
                  </button>
                  <button onClick={() => handleReject(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <X size={14} className="text-red-400" />
                  </button>
                  <button onClick={() => showToast('Opening review panel…')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Review</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
