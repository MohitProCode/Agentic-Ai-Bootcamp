import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'

const confidenceOptions = [
  { label: 'Low', value: 0.25, emoji: 'L' },
  { label: 'Medium', value: 0.6, emoji: 'M' },
  { label: 'High', value: 0.9, emoji: 'H' },
]

const toPercent = (value) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric <= 1 ? numeric * 100 : numeric)
}

const QuizStep = () => {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const goals = useStore((s) => s.onboarding.goals)
  const setOnboardingQuiz = useStore((s) => s.setOnboardingQuiz)
  const setLatestQuiz = useStore((s) => s.setLatestQuiz)
  const login = useStore((s) => s.login)

  const quizTopic = useMemo(() => {
    return goals?.skills?.[0] || goals?.targetRole || 'Software Engineering Fundamentals'
  }, [goals])

  const [sessionId, setSessionId] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [question, setQuestion] = useState(null)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [confidence, setConfidence] = useState(0.6)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isStarting, setIsStarting] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [nextQuestion, setNextQuestion] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (isPaused || !question || result) return undefined
    const intervalId = setInterval(() => {
      setElapsedSeconds((value) => value + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [isPaused, question, result])

  const beginQuiz = async () => {
    if (!user?.id) {
      setError('User profile not found. Please sign in again.')
      setIsStarting(false)
      return
    }
    setError('')
    setIsStarting(true)
    setFeedback(null)
    setResult(null)
    setNextQuestion(null)
    try {
      const response = await luminaApi.startQuiz({
        user_id: user.id,
        topic: quizTopic,
        target_concepts: goals?.skills || [],
        num_questions: 8,
      })
      setSessionId(response.session_id)
      setQuestionNumber(response.question_number)
      setTotalQuestions(response.total_questions)
      setQuestion(response.question)
      setSelectedOptionId('')
      setConfidence(0.6)
      setElapsedSeconds(0)
      setIsPaused(false)
      setOnboardingQuiz({
        sessionId: response.session_id,
        result: null,
      })
    } catch (apiError) {
      setError(apiError?.message || 'Unable to start adaptive quiz.')
    } finally {
      setIsStarting(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      beginQuiz()
    }, 0)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmitAnswer = async () => {
    if (!question || !sessionId) return
    if (!selectedOptionId) {
      setError('Please choose an option before continuing.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const answer = await luminaApi.submitQuizAnswer({
        session_id: sessionId,
        question_id: question.question_id,
        selected_option_id: selectedOptionId,
        confidence,
        time_spent_seconds: elapsedSeconds,
      })
      setFeedback(answer.feedback)
      setQuestionNumber(answer.question_number)
      if (answer.is_completed) {
        const quizResult = await luminaApi.getQuizResult(sessionId)
        setResult(quizResult)
        setLatestQuiz(sessionId, quizResult)
        setOnboardingQuiz({
          sessionId,
          result: quizResult,
        })
      } else {
        setNextQuestion(answer.next_question)
      }
      setIsPaused(true)
    } catch (apiError) {
      setError(apiError?.message || 'Unable to submit answer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToNextQuestion = () => {
    if (!nextQuestion) return
    setQuestion(nextQuestion)
    setNextQuestion(null)
    setFeedback(null)
    setSelectedOptionId('')
    setElapsedSeconds(0)
    setIsPaused(false)
  }

  const weakConcepts = useMemo(() => {
    if (!result?.user_performance) return []
    return [...result.user_performance]
      .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
      .slice(0, 3)
  }, [result])

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const seconds = String(elapsedSeconds % 60).padStart(2, '0')

  return (
    <div id="diagnostic_quiz_container" className="w-full max-w-3xl glass-panel rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-slate-700 flex flex-col max-h-[85vh]">
      <div id="progress_stepper" className="p-8 border-b border-slate-700/50 flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Adaptive Diagnostic Quiz</h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              This quiz adapts in real time and builds your progressive learning baseline.
            </p>
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

        <div className="flex items-center justify-between rounded-[8px] p-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#cbd5e1' }}>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-blue-400" />
              <span>Topic: <span className="text-white font-medium">{quizTopic}</span></span>
            </div>
            <div className="w-px h-4" style={{ background: '#334155' }} />
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-clock text-blue-400" />
              <span className="font-mono">{minutes}:{seconds}</span>
            </div>
          </div>
          <button
            onClick={() => setIsPaused((value) => !value)}
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-white"
            style={{ color: '#94a3b8' }}
            disabled={!question || Boolean(result)}
          >
            <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`} />
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="p-8 overflow-y-auto flex-1 space-y-6">
        {isStarting && <p className="text-sm text-blue-300">Starting quiz session...</p>}

        {!isStarting && error && (
          <div className="rounded-lg px-4 py-3 text-sm text-red-200" style={{ background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.5)' }}>
            {error}
          </div>
        )}

        {!result && question && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-300">Question {questionNumber} of {totalQuestions}</p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                  Difficulty: <span className="text-white">{question.difficulty}</span> | Concept: <span className="text-white">{question.concept_tag}</span>
                </p>
              </div>
            </div>

            <h3 className="text-base font-medium text-white">{question.prompt}</h3>

            <div className="grid grid-cols-1 gap-3">
              {(Array.isArray(question.options) ? question.options : []).map((option) => (
                <label
                  key={option.option_id}
                  className={`selectable-card rounded-[8px] p-4 flex items-start gap-3 cursor-pointer ${selectedOptionId === option.option_id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="dynamic_quiz_option"
                    value={option.option_id}
                    checked={selectedOptionId === option.option_id}
                    onChange={() => setSelectedOptionId(option.option_id)}
                    className="w-4 h-4 mt-0.5"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span className="text-sm" style={{ color: '#e2e8f0' }}>{option.text}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>Confidence level</p>
              <div className="flex gap-2">
                {confidenceOptions.map((level) => (
                  <button
                    key={level.label}
                    onClick={() => setConfidence(level.value)}
                    className="px-3 py-2 rounded-md text-xs font-medium"
                    style={{
                      background: confidence === level.value ? 'rgba(59,130,246,0.2)' : '#1e293b',
                      border: `1px solid ${confidence === level.value ? 'rgba(59,130,246,0.5)' : '#334155'}`,
                      color: confidence === level.value ? '#60a5fa' : '#cbd5e1',
                    }}
                  >
                    {level.emoji} {level.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {feedback && !result && (
          <section className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
            <div className="flex items-center gap-2">
              <i className={`fa-solid ${feedback.is_correct ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-rose-400'}`} />
              <p className="text-sm text-white">{feedback.is_correct ? 'Correct' : 'Needs improvement'}</p>
            </div>
            <p className="text-sm" style={{ color: '#cbd5e1' }}>{feedback.explanation}</p>
            {feedback.conceptual_error && (
              <p className="text-xs text-amber-300">Concept note: {feedback.conceptual_error}</p>
            )}
          </section>
        )}

        {result && (
          <section className="space-y-4">
            <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
              <h3 className="text-lg font-semibold text-white mb-2">Assessment Complete</h3>
              <p className="text-sm mb-3" style={{ color: '#cbd5e1' }}>
                Accuracy: <span className="text-blue-300 font-semibold">{toPercent(result.overall_accuracy)}%</span> ({result.correct_answers}/{result.answered_questions})
              </p>
              {weakConcepts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-amber-300">Focus areas for the next step</p>
                  {weakConcepts.map((concept) => (
                    <div key={concept.concept} className="text-sm" style={{ color: '#e2e8f0' }}>
                      {concept.concept}: {toPercent(concept.accuracy)}% mastery
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <div id="navigation_footer" className="p-6 border-t border-slate-700/50 flex items-center justify-between rounded-b-[12px] flex-shrink-0" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <button
          onClick={() => { login({ id: 'guest_user', name: 'Guest', email: 'guest@lumina.ai', isAuthenticated: true }); navigate('/dashboard') }}
          className="text-sm font-medium transition-colors hover:text-white"
          style={{ color: '#94a3b8' }}
        >
          Skip Assessment
        </button>
        <div className="flex gap-4">
          {!result && !nextQuestion && (
            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !question}
              className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}
          {!result && nextQuestion && (
            <button
              onClick={goToNextQuestion}
              className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2"
            >
              Next Question
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          )}
          {result && (
            <button
              onClick={() => navigate('/onboarding/plan')}
              className="primary-btn rounded-[8px] py-2.5 px-8 text-sm font-semibold text-white flex items-center gap-2"
            >
              Next Step
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          )}
          <button onClick={() => navigate('/onboarding/goals')} className="secondary-btn rounded-[8px] py-2.5 px-6 text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizStep
