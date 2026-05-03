import { Outlet, Link } from 'react-router-dom'

// ─── Onboarding Layout ────────────────────────
// Exact match: onboarding_container from step 1/2/3 HTMLs
const OnboardingLayout = () => {
  return (
    <div className="text-slate-200 min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0f172a' }}>
      {/* Ambient Glows */}
      <div className="ambient-glow" style={{ top: '-200px', left: '-100px' }} />
      <div className="ambient-glow" style={{ bottom: '-300px', right: '-100px', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(15,23,42,0) 70%)' }} />

      {/* Top Bar */}
      <div id="global_utility_header" className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <Link to="/login" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#2563eb' }}>
            <i className="fa-solid fa-graduation-cap text-white text-sm" />
          </div>
          <span className="font-semibold text-white tracking-tight">Lumina AI</span>
        </Link>

        <div className="flex items-center gap-4">
          <button className="text-sm flex items-center gap-2 transition-colors hover:text-white" style={{ color: '#94a3b8' }}>
            <i className="fa-solid fa-globe" />
            <span>EN</span>
            <i className="fa-solid fa-chevron-down text-xs" />
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-white" style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
            <i className="fa-solid fa-moon text-sm" />
          </button>
        </div>
      </div>

      {/* Main Content: centered card */}
      <main id="onboarding_container" className="flex-1 flex flex-col items-center justify-center w-full max-w-[1440px] mx-auto relative z-10 px-4 py-24 h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="global_utility_footer" className="w-full p-6 flex justify-between items-center text-xs z-20 relative mt-auto" style={{ color: '#64748b' }}>
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

export default OnboardingLayout
