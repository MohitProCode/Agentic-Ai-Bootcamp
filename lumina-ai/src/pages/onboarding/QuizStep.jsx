import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'

// ─── Onboarding Step 2: Diagnostic Quiz ───────
// Exact match: 2-Personalised Learning - Onboar.html
const QuizStep = () => {
  const navigate = useNavigate()
  const login = useStore(s => s.login)
  const [selectedQ1, setSelectedQ1] = useState('componentDidMount()')
  const [confidences, setConfidences] = useState({ q1: 2, q2: null, q3: null })
  const [q2Answer, setQ2Answer] = useState('')
  const [q3Answer, setQ3Answer] = useState('')
  const [timer, setTimer] = useState(14 * 60 + 59)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [isPaused])

  const setConfidence = (q, val) => setConfidences(prev => ({ ...prev, [q]: val }))

  const minutes = String(Math.floor(timer / 60)).padStart(2, '0')
  const seconds = String(timer % 60).padStart(2, '0')

  const q1Options = ['componentWillMount()', 'componentDidMount()', 'componentWillUpdate()', 'render()']

  const ConfidenceRow = ({ qKey }) => (
    <div className="pl-9 pt-4 flex items-center gap-4" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
      <span className="text-xs" style={{ color: '#94a3b8' }}>How confident are you?</span>
      <div className="flex gap-2">
        {[
          { emoji: '🤔', label: 'Low', val: 0 },
          { emoji: '😐', label: 'Medium', val: 1 },
          { emoji: '😎', label: 'High', val: 2 },
        ].map(btn => (
          <button
            key={btn.val}
            onClick={() => setConfidence(qKey, btn.val)}
            title={btn.label}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: confidences[qKey] === btn.val ? 'rgba(59,130,246,0.2)' : '#1e293b',
              border: `1px solid ${confidences[qKey] === btn.val ? 'rgba(59,130,246,0.5)' : '#334155'}`,
            }}
          >
            {btn.emoji}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div id="diagnostic_quiz_container" className="w-full max-w-3xl glass-panel rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-slate-700 flex flex-col max-h-[85vh]">

      {/* Header & Progress */}
      <div id="progress_stepper" className="p-8 border-b border-slate-700/50 flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Diagnostic Assessment</h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Let's gauge your current proficiency to build the perfect path.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider block mb-2">Step 2 of 3</span>
            <div className="flex gap-2">
              <div className="w-8 h-1.5 rounded-full bg-blue-500" />
              <div className="w-8 h-1.5 rounded-full bg-blue-500" />
              <div className="w-8 h-1.5 rounded-full" style={{ background: '#334155' }} />
            </div>
          </div>
        </div>

        {/* Quiz Meta Bar */}
        <div className="flex items-center justify-between rounded-[8px] p-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#cbd5e1' }}>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-blue-400" />
              <span>Difficulty: <span className="text-white font-medium">Intermediate</span></span>
            </div>
            <div className="w-px h-4" style={{ background: '#334155' }} />
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-clock text-blue-400" />
              <span className="font-mono">{minutes}:{seconds}</span>
            </div>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-white"
            style={{ color: '#94a3b8' }}
          >
            <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`} />
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Scrollable Quiz Content */}
      <div className="p-8 overflow-y-auto flex-1 space-y-10">

        {/* Question 1: MCQ */}
        <section id="question_1_mcq" className="space-y-6">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-blue-400" style={{ background: 'rgba(59,130,246,0.2)' }}>1</div>
            <div>
              <h3 className="text-base font-medium text-white mb-2">Which lifecycle method is invoked immediately after a component is mounted in React?</h3>
              <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Select the single best answer.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
            {q1Options.map(opt => (
              <label
                key={opt}
                className={`selectable-card${selectedQ1 === opt ? ' selected' : ''} rounded-[8px] p-4 flex items-center gap-3`}
              >
                <input
                  type="radio"
                  name="q1"
                  value={opt}
                  checked={selectedQ1 === opt}
                  onChange={() => setSelectedQ1(opt)}
                  className="w-4 h-4"
                  style={{ accentColor: '#3b82f6' }}
                />
                <span className="text-sm font-mono" style={{ color: '#e2e8f0' }}>{opt}</span>
              </label>
            ))}
          </div>

          <ConfidenceRow qKey="q1" />
        </section>

        {/* Question 2: Code / Logic */}
        <section id="question_2_code" className="space-y-6">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-blue-400" style={{ background: 'rgba(59,130,246,0.2)' }}>2</div>
            <div className="w-full">
              <h3 className="text-base font-medium text-white mb-2">Analyze the following Python snippet. What will be the output?</h3>

              {/* Code block */}
              <div className="rounded-[8px] p-4 my-4 font-mono text-sm overflow-x-auto" style={{ background: '#0d1117', border: '1px solid #334155' }}>
                <pre><code>
                  <span className="code-keyword">def</span> <span className="code-function">mystery_func</span>(lst):{'\n'}
                  {'    '}<span className="code-keyword">return</span> [x <span className="code-keyword">for</span> x <span className="code-keyword">in</span> lst <span className="code-keyword">if</span> x % 2 == 0]{'\n'}
                  {'\n'}
                  nums = [1, 2, 3, 4, 5, 6]{'\n'}
                  result = mystery_func(nums){'\n'}
                  <span className="code-function">print</span>(result)
                </code></pre>
              </div>

              <input
                type="text"
                placeholder="Enter output here..."
                value={q2Answer}
                onChange={e => setQ2Answer(e.target.value)}
                className="input-field rounded-[8px] py-3 px-4 text-sm"
              />
            </div>
          </div>

          <ConfidenceRow qKey="q2" />
        </section>

        {/* Question 3: Short Answer */}
        <section id="question_3_short_answer" className="space-y-6">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-blue-400" style={{ background: 'rgba(59,130,246,0.2)' }}>3</div>
            <div className="w-full">
              <h3 className="text-base font-medium text-white mb-2">Briefly explain the concept of "Dependency Injection" in system design.</h3>
              <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Keep it under 3 sentences.</p>
              <textarea
                rows={3}
                placeholder="Type your explanation..."
                value={q3Answer}
                onChange={e => setQ3Answer(e.target.value)}
                className="input-field rounded-[8px] py-3 px-4 text-sm resize-none"
              />
            </div>
          </div>

          <ConfidenceRow qKey="q3" />
        </section>

      </div>

      {/* Footer Actions */}
      <div id="navigation_footer" className="p-6 border-t border-slate-700/50 flex items-center justify-between rounded-b-[12px] flex-shrink-0" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <button
          onClick={() => { login({ name: 'Guest', email: 'guest@lumina.ai', isAuthenticated: true }); navigate('/dashboard') }}
          className="text-sm font-medium transition-colors hover:text-white" style={{ color: '#94a3b8' }}>
          Skip Assessment
        </button>
        <div className="flex gap-4">
          <button onClick={() => navigate('/onboarding/goals')} className="secondary-btn rounded-[8px] py-2.5 px-6 text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Back
          </button>
          <button onClick={() => navigate('/onboarding/plan')} className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2">
            Next Step
            <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizStep
