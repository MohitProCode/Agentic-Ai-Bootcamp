import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'

const toPercent = (value) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric <= 1 ? numeric * 100 : numeric)
}

const PlanStep = () => {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const latestQuiz = useStore((s) => s.latestQuiz)
  const goals = useStore((s) => s.onboarding.goals)
  const addReportHistory = useStore((s) => s.addReportHistory)
  const setOnboardingPlan = useStore((s) => s.setOnboardingPlan)

  const [selectedTrack, setSelectedTrack] = useState('Advanced React Patterns & Performance')
  const [pace, setPace] = useState('Standard')
  const [formats, setFormats] = useState(['Interactive Coding', 'Text Guides'])
  const [showModal, setShowModal] = useState(false)
  const [genProgress, setGenProgress] = useState(10)
  const [loadingText, setLoadingText] = useState('Analyzing assessment gaps...')
  const [genDone, setGenDone] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const intervalRef = useRef(null)

  const quizResult = latestQuiz?.result
  const accuracy = toPercent(quizResult?.overall_accuracy)

  const detectedLevel = useMemo(() => {
    if (accuracy >= 80) return 'Advanced'
    if (accuracy >= 60) return 'Intermediate'
    return 'Beginner'
  }, [accuracy])

  const performanceBars = useMemo(() => {
    const conceptPerformance = Array.isArray(quizResult?.concept_performance) ? quizResult.concept_performance : []
    if (!conceptPerformance.length) {
      return [
        { label: 'Core Concepts', pct: 85, color: '#3b82f6', textColor: 'text-blue-400' },
        { label: 'State Management', pct: 40, color: '#64748b', textColor: 'text-slate-400' },
        { label: 'Performance Optimization', pct: 25, color: '#64748b', textColor: 'text-slate-400' },
      ]
    }
    return conceptPerformance.slice(0, 3).map((item, index) => ({
      label: item.concept,
      pct: toPercent(item.accuracy),
      color: index === 0 ? '#3b82f6' : '#64748b',
      textColor: index === 0 ? 'text-blue-400' : 'text-slate-400',
    }))
  }, [quizResult])

  const radarData = useMemo(() => {
    const userPerformance = Array.isArray(quizResult?.user_performance) ? quizResult.user_performance : []
    if (!userPerformance.length) {
      return [
        { skill: 'Core React', value: 85 },
        { skill: 'State Mgmt', value: 40 },
        { skill: 'Performance', value: 25 },
        { skill: 'Testing', value: 60 },
        { skill: 'Routing', value: 75 },
      ]
    }
    return userPerformance.slice(0, 5).map((item) => ({
      skill: item.concept,
      value: toPercent(item.accuracy),
    }))
  }, [quizResult])

  const tracks = [
    { icon: 'fa-solid fa-rocket', title: 'Advanced React Patterns & Performance', desc: 'Focused remediation on weak concepts from your adaptive quiz.' },
    { icon: 'fa-solid fa-layer-group', title: 'Full-Stack Integration', desc: 'Progressive backend and frontend integration track with practical projects.' },
  ]

  const allFormats = ['Interactive Coding', 'Video Lectures', 'Text Guides', 'Projects']

  const toggleFormat = (formatValue) => {
    setFormats((previous) =>
      previous.includes(formatValue) ? previous.filter((entry) => entry !== formatValue) : [...previous, formatValue]
    )
  }

  const startGeneration = async () => {
    setShowModal(true)
    setGenerationError('')
    setGeneratedPlan(null)
    setGenProgress(10)
    setLoadingText('Analyzing assessment gaps...')
    setGenDone(false)

    let width = 10
    let stepIndex = 0
    const steps = ['Curating project modules...', 'Aligning pace preferences...', 'Finalizing weekly structure...']

    intervalRef.current = setInterval(() => {
      width = Math.min(width + Math.random() * 8, 92)
      setGenProgress(Math.round(width))
      if (width > 30 && stepIndex === 0) { setLoadingText(steps[0]); stepIndex += 1 }
      if (width > 60 && stepIndex === 1) { setLoadingText(steps[1]); stepIndex += 1 }
      if (width > 80 && stepIndex === 2) { setLoadingText(steps[2]); stepIndex += 1 }
    }, 350)

    try {
      if (!user?.id) throw new Error('User session missing. Please sign in again.')
      const response = await luminaApi.generatePlan({
        user_id: user.id,
        topic: quizResult?.topic || goals?.targetRole || selectedTrack,
        weeks: 4,
        quiz_session_id: latestQuiz?.sessionId || null,
      })

      setGeneratedPlan(response)
      setOnboardingPlan({
        detectedLevel: `${detectedLevel} (${accuracy}%)`,
        selectedTrack,
        pace,
      })

      addReportHistory({
        id: `${latestQuiz?.sessionId || Date.now()}_${user.id}`,
        createdAt: new Date().toISOString(),
        source: 'onboarding',
        topic: response?.plan?.topic || goals?.targetRole || selectedTrack,
        quizSessionId: latestQuiz?.sessionId || null,
        accuracy,
        summary: response?.gap_report?.summary || '',
        weakConcepts: Array.isArray(response?.gap_report?.weak_concepts)
          ? response.gap_report.weak_concepts.map((item) => ({
              concept: item.concept,
              weaknessScore: Number(item.weakness_score || 0),
              recommendation: item.recommendation || '',
              misconceptions: Array.isArray(item.misconceptions) ? item.misconceptions : [],
            }))
          : [],
        validationIssues: Array.isArray(response?.validation?.issues) ? response.validation.issues : [],
        planWeeks: Array.isArray(response?.plan?.weeks) ? response.plan.weeks.length : 0,
        raw: response,
      })
    } catch (apiError) {
      setGenerationError(apiError?.message || 'Failed to generate the learning plan.')
    } finally {
      clearInterval(intervalRef.current)
      setGenProgress(100)
      setGenDone(true)
    }
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <>
      <div id="path_configuration_container" className="w-full max-w-5xl glass-panel rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-slate-700 flex flex-col max-h-[85vh]">
        <div id="progress_stepper" className="p-8 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Path Configuration</h1>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Review your assessment results and generate a progressive roadmap.</p>
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

        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div id="assessment_results_col" className="space-y-6 flex flex-col">
              <div className="flex-shrink-0 p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Detected Level</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    {detectedLevel} ({accuracy}%)
                  </span>
                </div>

                <div className="space-y-4">
                  {performanceBars.map((bar) => (
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

            <div id="path_customization_col" className="space-y-6 flex flex-col">
              <div className="p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Recommended Track</h3>
                {tracks.map((track) => (
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

              <div className="flex-1 p-6 rounded-[12px]" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Pace & Format Preferences</h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm block mb-3" style={{ color: '#cbd5e1' }}>Weekly Commitment</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ label: 'Casual', sub: '2-4 hrs' }, { label: 'Standard', sub: '5-8 hrs' }, { label: 'Intensive', sub: '10+ hrs' }].map((entry) => (
                        <label key={entry.label} onClick={() => setPace(entry.label)} className={`selectable-card${pace === entry.label ? ' selected' : ''} rounded-[8px] p-3 text-center cursor-pointer`}>
                          <input type="radio" name="pace" className="sr-only" readOnly checked={pace === entry.label} />
                          <span className="text-sm block mb-1" style={{ color: pace === entry.label ? '#60a5fa' : '#cbd5e1', fontWeight: pace === entry.label ? '500' : '400' }}>{entry.label}</span>
                          <span className="text-xs" style={{ color: pace === entry.label ? 'rgba(59,130,246,0.7)' : '#64748b' }}>{entry.sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm block mb-3" style={{ color: '#cbd5e1' }}>Preferred Formats</label>
                    <div className="flex flex-wrap gap-2">
                      {allFormats.map((formatValue) => (
                        <button
                          key={formatValue}
                          onClick={() => toggleFormat(formatValue)}
                          className="px-4 py-2 rounded-[8px] text-sm transition-colors"
                          style={{
                            background: formats.includes(formatValue) ? 'rgba(59,130,246,0.2)' : '#1e293b',
                            border: `1px solid ${formats.includes(formatValue) ? 'rgba(59,130,246,0.5)' : '#334155'}`,
                            color: formats.includes(formatValue) ? '#60a5fa' : '#cbd5e1',
                          }}
                        >
                          {formatValue}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel w-full max-w-md rounded-[16px] p-8 text-center relative overflow-hidden" style={{ border: '1px solid #334155', boxShadow: '0 0 50px rgba(59,130,246,0.15)' }}>
            {!genDone ? (
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
              <div id="modal_success_state">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${generationError ? 'text-rose-400' : 'text-blue-400'}`} style={{ background: generationError ? 'rgba(225,29,72,0.12)' : 'rgba(59,130,246,0.2)', border: generationError ? '1px solid rgba(225,29,72,0.4)' : '1px solid rgba(59,130,246,0.5)' }}>
                  <i className={`fa-solid ${generationError ? 'fa-triangle-exclamation' : 'fa-check'} text-3xl`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{generationError ? 'Generation Failed' : 'Plan Ready!'}</h3>
                <p className="text-sm mb-8" style={{ color: '#94a3b8' }}>
                  {generationError
                    ? generationError
                    : generatedPlan?.gap_report?.summary || 'Your personalized learning path has been generated and report history has been saved.'}
                </p>
                <button
                  onClick={() => {
                    if (generationError) {
                      setShowModal(false)
                      return
                    }
                    navigate('/dashboard')
                  }}
                  className="w-full primary-btn rounded-[8px] py-3 px-4 text-sm font-semibold text-white flex items-center justify-center gap-2"
                >
                  {generationError ? 'Close' : 'Enter Dashboard'}
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
