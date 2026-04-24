import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import useStore from '../../store/useStore'

// ─── Onboarding Step 3: Path Configuration ────
// Exact match: 3-Personalised Learning - Onboar.html
// Includes: AI generation modal with progress animation
const PlanStep = () => {
  const navigate = useNavigate()
  const login = useStore(s => s.login)
  const [selectedTrack, setSelectedTrack] = useState('Advanced React Patterns & Performance')
  const [pace, setPace] = useState('Standard')
  const [formats, setFormats] = useState(['Interactive Coding', 'Text Guides'])
  const [showModal, setShowModal] = useState(false)
  const [genProgress, setGenProgress] = useState(10)
  const [loadingText, setLoadingText] = useState('Analyzing assessment gaps...')
  const [genDone, setGenDone] = useState(false)
  const intervalRef = useRef(null)

  const radarData = [
    { skill: 'Core React', value: 85 },
    { skill: 'State Mgmt', value: 40 },
    { skill: 'Performance', value: 25 },
    { skill: 'Testing', value: 60 },
    { skill: 'Routing', value: 75 },
  ]

  const tracks = [
    { icon: 'fa-solid fa-rocket', title: 'Advanced React Patterns & Performance', desc: 'Focuses on your identified gaps in state management and rendering optimization.', active: true },
    { icon: 'fa-solid fa-layer-group', title: 'Full-Stack Integration', desc: 'Broaden your scope by connecting React to backend services.', active: false },
  ]

  const allFormats = ['Interactive Coding', 'Video Lectures', 'Text Guides', 'Projects']

  const toggleFormat = (fmt) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt])
  }

  const startGeneration = () => {
    setShowModal(true)
    setGenProgress(10)
    setLoadingText('Analyzing assessment gaps...')
    setGenDone(false)

    let width = 10
    let stepIndex = 0
    const steps = ['Curating project modules...', 'Aligning pace preferences...', 'Finalizing weekly structure...']

    intervalRef.current = setInterval(() => {
      if (width >= 100) {
        clearInterval(intervalRef.current)
        setTimeout(() => setGenDone(true), 500)
      } else {
        width += Math.random() * 15
        if (width > 100) width = 100
        setGenProgress(Math.round(width))

        if (width > 30 && stepIndex === 0) { setLoadingText(steps[0]); stepIndex++ }
        else if (width > 60 && stepIndex === 1) { setLoadingText(steps[1]); stepIndex++ }
        else if (width > 85 && stepIndex === 2) { setLoadingText(steps[2]); stepIndex++ }
      }
    }, 400)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <>
      <div id="path_configuration_container" className="w-full max-w-5xl glass-panel rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-slate-700 flex flex-col max-h-[85vh]">

        {/* Header & Progress */}
        <div id="progress_stepper" className="p-8 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Path Configuration</h1>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Review your assessment results and customize your learning journey.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider block mb-2">Step 3 of 3</span>
              <div className="flex gap-2">
                <div className="w-8 h-1.5 rounded-full bg-blue-500" />
                <div className="w-8 h-1.5 rounded-full bg-blue-500" />
                <div className="w-8 h-1.5 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Grid */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

            {/* LEFT: Assessment Results */}
            <div id="assessment_results_col" className="space-y-6 flex flex-col">

              {/* Detected Level */}
              <div className="flex-shrink-0 p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Detected Level</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>Intermediate React</span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Core Concepts', pct: 85, color: '#3b82f6', textColor: 'text-blue-400' },
                    { label: 'State Management', pct: 40, color: '#64748b', textColor: 'text-slate-400' },
                    { label: 'Performance Optimization', pct: 25, color: '#64748b', textColor: 'text-slate-400' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: '#cbd5e1' }}>{bar.label}</span>
                        <span className={bar.textColor}>{bar.pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                        <div className="h-full rounded-full" style={{ width: `${bar.pct}%`, background: bar.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Radar */}
              <div className="flex-1 min-h-[280px] flex flex-col p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Skill Radar</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData} outerRadius={90}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Skills" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RIGHT: Path Customization */}
            <div id="path_customization_col" className="space-y-6 flex flex-col">

              {/* Recommended Track */}
              <div className="p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Recommended Track</h3>
                {tracks.map(track => (
                  <div
                    key={track.title}
                    onClick={() => setSelectedTrack(track.title)}
                    className={`selectable-card${selectedTrack === track.title ? ' selected' : ''} rounded-[8px] p-4 flex items-start gap-4 mb-3 last:mb-0`}
                  >
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: selectedTrack === track.title ? 'rgba(59,130,246,0.2)' : '#1e293b',
                        border: `1px solid ${selectedTrack === track.title ? 'rgba(59,130,246,0.3)' : '#334155'}`,
                      }}
                    >
                      <i className={`${track.icon} ${selectedTrack === track.title ? 'text-blue-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">{track.title}</h4>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{track.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pace & Format */}
              <div className="flex-1 p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Pace & Format Preferences</h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm block mb-3" style={{ color: '#cbd5e1' }}>Weekly Commitment</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ label: 'Casual', sub: '2-4 hrs' }, { label: 'Standard', sub: '5-8 hrs' }, { label: 'Intensive', sub: '10+ hrs' }].map(p => (
                        <label
                          key={p.label}
                          onClick={() => setPace(p.label)}
                          className={`selectable-card${pace === p.label ? ' selected' : ''} rounded-[8px] p-3 text-center cursor-pointer`}
                        >
                          <input type="radio" name="pace" className="sr-only" readOnly checked={pace === p.label} />
                          <span className="text-sm block mb-1" style={{ color: pace === p.label ? '#60a5fa' : '#cbd5e1', fontWeight: pace === p.label ? '500' : '400' }}>{p.label}</span>
                          <span className="text-xs" style={{ color: pace === p.label ? 'rgba(59,130,246,0.7)' : '#64748b' }}>{p.sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm block mb-3" style={{ color: '#cbd5e1' }}>Preferred Formats</label>
                    <div className="flex flex-wrap gap-2">
                      {allFormats.map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => toggleFormat(fmt)}
                          className="px-4 py-2 rounded-[8px] text-sm transition-colors"
                          style={{
                            background: formats.includes(fmt) ? 'rgba(59,130,246,0.2)' : '#1e293b',
                            border: `1px solid ${formats.includes(fmt) ? 'rgba(59,130,246,0.5)' : '#334155'}`,
                            color: formats.includes(fmt) ? '#60a5fa' : '#cbd5e1',
                          }}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div id="navigation_footer" className="p-6 border-t border-slate-700/50 flex items-center justify-between rounded-b-[12px] flex-shrink-0" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <button onClick={() => navigate('/onboarding/quiz')} className="secondary-btn rounded-[8px] py-2.5 px-6 text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Back
          </button>
          <button onClick={startGeneration} className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-xs" />
            Generate AI Plan
          </button>
        </div>
      </div>

      {/* ── AI Generation Modal ─────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel w-full max-w-md rounded-[16px] p-8 text-center relative overflow-hidden" style={{ border: '1px solid #334155', boxShadow: '0 0 50px rgba(59,130,246,0.15)' }}>

            {!genDone ? (
              /* Loading State */
              <div id="modal_loading_state">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(59,130,246,0.2)' }} />
                  <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
                  <div className="absolute inset-0 rounded-full pulse-circle border-2 border-blue-400" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                    <i className="fa-solid fa-microchip text-2xl" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Crafting Your Syllabus</h3>
                <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>{loadingText}</p>
                <div className="w-full rounded-full h-1.5 mb-2 overflow-hidden" style={{ background: '#1e293b' }}>
                  <div className="bg-blue-500 h-1.5 rounded-full shimmer-bg transition-all duration-300" style={{ width: `${genProgress}%` }} />
                </div>
              </div>
            ) : (
              /* Success State */
              <div id="modal_success_state">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-blue-400" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)' }}>
                  <i className="fa-solid fa-check text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Plan Ready!</h3>
                <p className="text-sm mb-8" style={{ color: '#94a3b8' }}>Your personalized learning path has been successfully generated.</p>
                <button
                  onClick={() => {
                    login({ name: 'Alex', email: 'alex.j@example.com', isAuthenticated: true })
                    navigate('/dashboard')
                  }}
                  className="w-full primary-btn rounded-[8px] py-3 px-4 text-sm font-semibold text-white flex items-center justify-center gap-2">
                  Enter Dashboard
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default PlanStep
