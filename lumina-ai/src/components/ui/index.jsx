import React from 'react'

// ─── Button Component ─────────────────────────
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon,
}) => {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium
    rounded-lg transition-all duration-200 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-blue-500/40
  `

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  }

  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: `text-slate-300 hover:text-white border hover:bg-white/5`,
    ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
  }

  const borderStyle = variant === 'secondary'
    ? { borderColor: 'rgba(255,255,255,0.12)' }
    : {}

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={borderStyle}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// ─── Badge Component ──────────────────────────
export const Badge = ({ children, color = 'blue', size = 'sm', className = '' }) => {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    purple: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    slate: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  }
  const sizes = { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[color]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

// ─── Input Component ──────────────────────────
export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  rightElement,
  leftElement,
  helperText,
  error,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {leftElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftElement}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
          className={`
            w-full rounded-lg text-sm text-white placeholder:text-slate-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/40
            transition-all duration-150
            ${leftElement ? 'pl-9' : 'px-3'} ${rightElement ? 'pr-10' : 'px-3'} py-2.5
            ${className}
          `}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightElement}
          </div>
        )}
      </div>
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Card Component ───────────────────────────
export const Card = ({ children, className = '', hover = false, padding = true, style = {} }) => {
  return (
    <div
      style={{
        background: '#0d1624',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        ...style
      }}
      className={`
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:border-white/10 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────
export const Skeleton = ({ width = '100%', height = '16px', className = '' }) => (
  <div
    className={`skeleton rounded ${className}`}
    style={{ width, height }}
  />
)

// ─── Avatar Component ─────────────────────────
export const Avatar = ({ name = 'User', src, size = 32, className = '' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.35,
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      }}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
        : initials
      }
    </div>
  )
}

// ─── Stat Card Component ──────────────────────
export const StatCard = ({ label, value, delta, deltaPositive = true, icon }) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {delta && (
            <p className={`text-xs font-medium ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {deltaPositive ? '↑' : '↓'} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Divider with Text ────────────────────────
export const DividerText = ({ text }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    <span className="text-xs text-slate-600 uppercase tracking-widest">{text}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
  </div>
)

// ─── OAuth Button ─────────────────────────────
export const OAuthButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}
    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/7 hover:border-white/12 transition-all duration-150"
  >
    {icon}
    {label}
  </button>
)

// ─── Progress Bar ─────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'blue', height = 6 }) => {
  const colorMap = {
    blue: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    green: 'linear-gradient(90deg, #10b981, #34d399)',
    purple: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    amber: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  }
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ height, background: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: colorMap[color] || colorMap.blue }}
      />
    </div>
  )
}

// ─── Step Indicator ───────────────────────────
export const StepIndicator = ({ current, total }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: i + 1 === current ? 24 : 16,
            background: i + 1 <= current ? '#3b82f6' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  )
}
