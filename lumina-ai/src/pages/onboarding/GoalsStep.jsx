import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'

const GoalsStep = () => {
  const navigate = useNavigate()
  const setOnboardingGoals = useStore(s => s.setOnboardingGoals)
  const login = useStore(s => s.login)

  const [selectedRole, setSelectedRole] = useState('Software Engineer')
  const [selectedSkills, setSelectedSkills] = useState(['React & Next.js', 'TypeScript'])
  const [learningStyle, setLearningStyle] = useState('Project-based (Hands-on)')

  const roles = [
    { icon: 'fa-solid fa-code', title: 'Software Engineer', sub: 'Full-stack, Frontend, Backend', color: 'blue' },
    { icon: 'fa-solid fa-database', title: 'Data Scientist', sub: 'ML, AI, Data Analysis', color: 'slate' },
    { icon: 'fa-solid fa-pen-nib', title: 'Product Designer', sub: 'UX/UI, Research, Systems', color: 'slate' },
  ]

  const availableSkills = ['Node.js', 'Python', 'System Design']
  const learningStyles = ['Project-based (Hands-on)', 'Video Lectures & Quizzes', 'Reading & Documentation']

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const handleNext = () => {
    setOnboardingGoals({ targetRole: selectedRole, skills: selectedSkills, learningStyle })
    navigate('/onboarding/quiz')
  }

  const handleSkip = () => {
    login({ name: 'Guest', email: 'guest@lumina.ai', isAuthenticated: true })
    navigate('/dashboard')
  }

  return (
    <div id="onboarding_form_card" className="w-full max-w-3xl glass-panel rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-slate-700 flex flex-col max-h-[85vh]">

      {/* Header & Progress */}
      <div className="p-8 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Tell us about your goals</h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>We'll use this to tailor your curriculum and learning pace.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider block mb-2">Step 1 of 3</span>
            <div className="flex gap-2">
              <div className="w-8 h-1.5 rounded-full bg-blue-500" />
              <div className="w-8 h-1.5 rounded-full" style={{ background: '#334155' }} />
              <div className="w-8 h-1.5 rounded-full" style={{ background: '#334155' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="p-8 overflow-y-auto flex-1 space-y-8">

        {/* Role Target */}
        <section id="role_target_section">
          <label className="block text-sm font-medium text-white mb-4">What is your target role?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div
                key={role.title}
                onClick={() => setSelectedRole(role.title)}
                className={`selectable-card${selectedRole === role.title ? ' selected' : ''} rounded-[8px] p-4 flex flex-col items-center text-center gap-3`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  selectedRole === role.title
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-300'
                }`} style={{ background: selectedRole === role.title ? undefined : 'rgba(51,65,85,0.5)' }}>
                  <i className={role.icon} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">{role.title}</h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{role.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skill Areas Multi-select Chips */}
        <section id="skill_areas_section">
          <label className="block text-sm font-medium text-white mb-4">Select core skill areas to focus on</label>
          <div className="flex flex-wrap gap-3">
            {selectedSkills.map(skill => (
              <div
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="px-4 py-2 rounded-full text-sm cursor-pointer flex items-center gap-2 transition-colors"
                style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
              >
                <span>{skill}</span>
                <i className="fa-solid fa-xmark text-xs opacity-70" />
              </div>
            ))}
            {availableSkills.filter(s => !selectedSkills.includes(s)).map(skill => (
              <div
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="px-4 py-2 rounded-full text-sm cursor-pointer hover:border-slate-500 transition-colors"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }}
              >
                {skill}
              </div>
            ))}
            <div
              className="px-4 py-2 rounded-full text-sm cursor-pointer flex items-center gap-2 transition-colors hover:text-white hover:border-slate-400"
              style={{ border: '1px dashed #475569', color: '#94a3b8' }}
            >
              <i className="fa-solid fa-plus text-xs" />
              <span>Add more skills</span>
            </div>
          </div>
        </section>

        {/* Availability & Timeframe */}
        <section id="availability_section" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-white mb-4">Weekly Availability</label>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold inline-block text-blue-400">15 hrs/week</span>
                <span className="text-xs font-semibold inline-block" style={{ color: '#94a3b8' }}>40+ hrs</span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full" style={{ background: '#334155' }}>
                <div style={{ width: '35%', background: '#3b82f6' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center" />
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>Moderate pace. Good for balancing with a full-time job.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-4">Target Timeframe</label>
            <div className="relative">
              <select className="w-full input-field rounded-[8px] py-2.5 px-4 text-sm appearance-none cursor-pointer">
                <option value="3" style={{ background: '#1e293b' }}>3 Months (Intensive)</option>
                <option value="6" style={{ background: '#1e293b' }} defaultValue>6 Months (Recommended)</option>
                <option value="9" style={{ background: '#1e293b' }}>9 Months (Relaxed)</option>
                <option value="12" style={{ background: '#1e293b' }}>12+ Months (Continuous Learning)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={{ color: '#94a3b8' }}>
                <i className="fa-solid fa-chevron-down text-xs" />
              </div>
            </div>
          </div>
        </section>

        {/* Learning Style & Preferences */}
        <section id="preferences_section" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-white mb-4">Preferred Learning Style</label>
            <div className="space-y-3">
              {learningStyles.map(style => (
                <label
                  key={style}
                  className="flex items-center p-3 rounded-[8px] cursor-pointer hover:border-slate-500 transition-colors"
                  style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155' }}
                >
                  <input
                    type="radio"
                    name="learning_style"
                    value={style}
                    checked={learningStyle === style}
                    onChange={() => setLearningStyle(style)}
                    className="w-4 h-4"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span className="ml-3 text-sm" style={{ color: '#cbd5e1' }}>{style}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Content Language</label>
              <div className="relative">
                <select className="w-full input-field rounded-[8px] py-2.5 px-4 text-sm appearance-none cursor-pointer">
                  <option value="en" style={{ background: '#1e293b' }}>English (US)</option>
                  <option value="es" style={{ background: '#1e293b' }}>Spanish</option>
                  <option value="fr" style={{ background: '#1e293b' }}>French</option>
                  <option value="de" style={{ background: '#1e293b' }}>German</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={{ color: '#94a3b8' }}>
                  <i className="fa-solid fa-chevron-down text-xs" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Timezone</label>
              <div className="relative">
                <select className="w-full input-field rounded-[8px] py-2.5 px-4 text-sm appearance-none cursor-pointer">
                  <option value="pst" style={{ background: '#1e293b' }}>Pacific Time (PT) - US & Canada</option>
                  <option value="est" style={{ background: '#1e293b' }}>Eastern Time (ET) - US & Canada</option>
                  <option value="gmt" style={{ background: '#1e293b' }}>Greenwich Mean Time (GMT)</option>
                  <option value="cet" style={{ background: '#1e293b' }}>Central European Time (CET)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={{ color: '#94a3b8' }}>
                  <i className="fa-solid fa-chevron-down text-xs" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-700/50 flex items-center justify-between rounded-b-[12px] flex-shrink-0" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <button onClick={handleSkip} className="text-sm font-medium transition-colors hover:text-white" style={{ color: '#94a3b8' }}>
          Skip for now
        </button>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="secondary-btn rounded-[8px] py-2.5 px-6 text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Back
          </button>
          <button onClick={handleNext} className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2">
            Next Step
            <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default GoalsStep
