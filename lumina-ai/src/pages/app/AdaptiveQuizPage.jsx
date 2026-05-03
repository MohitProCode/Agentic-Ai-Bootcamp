import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useStore from '../../store/useStore'
import { luminaApi } from '../../api/luminaApi'
import AgentActivityFeed from '../../components/AgentActivityFeed'

const confidenceOptions = [
  { label: 'Low', value: 0.25 },
  { label: 'Medium', value: 0.6 },
  { label: 'High', value: 0.9 },
]

const toPercent = (value) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric <= 1 ? numeric * 100 : numeric)
}

const buildTopicKey = (topic) => {
  return String(topic || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const dedupeTopics = (topics = []) => {
  const seen = new Set()
  return (Array.isArray(topics) ? topics : []).reduce((acc, topic) => {
    const cleanTopic = String(topic || '').trim()
    if (!cleanTopic) return acc
    const key = cleanTopic.toLowerCase()
    if (seen.has(key)) return acc
    seen.add(key)
    acc.push(cleanTopic)
    return acc
  }, [])
}

const deriveDifficulty = (experienceLevel) => {
  const level = String(experienceLevel || '').toLowerCase()
  if (level.includes('beginner')) return 'beginner'
  if (level.includes('advanced')) return 'advanced'
  return 'intermediate'
}

const deriveQuestionCount = (weeklyHours) => {
  const numericHours = Number(weeklyHours)
  if (!Number.isFinite(numericHours)) return 6
  if (numericHours >= 20) return 10
  if (numericHours >= 12) return 8
  if (numericHours >= 6) return 6
  return 5
}

const buildTopicWiseQuizzes = ({ profile, goals, roadmap }) => {
  const profileTopics = Array.isArray(profile?.focusTopics) ? profile.focusTopics : []
  const goalTopics = Array.isArray(goals?.skills) ? goals.skills : []
  const roadmapTopics = roadmap?.upNext?.title ? [roadmap.upNext.title] : []
  const fallbackTopic = profile?.targetRole || goals?.targetRole || 'Software Engineering Fundamentals'

  const topics = dedupeTopics([...profileTopics, ...goalTopics, ...roadmapTopics, fallbackTopic]).slice(0, 8)
  const conceptPool = dedupeTopics([...profileTopics, ...goalTopics]).slice(0, 12)
  const questionCount = deriveQuestionCount(profile?.weeklyHours ?? goals?.weeklyHours ?? 10)
  const difficulty = deriveDifficulty(profile?.experienceLevel)

  return topics.map((topic, index) => {
    const normalizedTopic = topic.toLowerCase()
    const relatedConcepts = conceptPool
      .filter((concept) => {
        const normalizedConcept = concept.toLowerCase()
        return (
          normalizedConcept === normalizedTopic ||
          normalizedConcept.includes(normalizedTopic) ||
          normalizedTopic.includes(normalizedConcept)
        )
      })
      .slice(0, 3)

    return {
      id: `${buildTopicKey(topic) || 'topic'}_${index + 1}`,
      topic,
      difficulty,
      numQuestions: questionCount,
      targetConcepts: dedupeTopics([topic, ...relatedConcepts]),
    }
  })
}

const AdaptiveQuizPage = () => {
  const user = useStore((s) => s.user)
  const goals = useStore((s) => s.onboarding.goals)
  const roadmap = useStore((s) => s.roadmap)
  const setLatestQuiz = useStore((s) => s.setLatestQuiz)
  const addReportHistory = useStore((s) => s.addReportHistory)

  const topicQuizzes = useMemo(() => {
    return buildTopicWiseQuizzes({ profile: user?.profile, goals, roadmap })
  }, [user?.profile, goals, roadmap])

  const profileSummary = useMemo(() => {
    const role = user?.profile?.targetRole || goals?.targetRole || 'Learner Track'
    const experience = user?.profile?.experienceLevel || 'Intermediate'
    const weeklyHours = Number(user?.profile?.weeklyHours ?? goals?.weeklyHours ?? 10)
    return {
      role,
      experience,
      weeklyHours: Number.isFinite(weeklyHours) ? Math.max(1, Math.round(weeklyHours)) : 10,
    }
  }, [user?.profile, goals])

  const [activeQuizId, setActiveQuizId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [confidence, setConfidence] = useState(0.6)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [nextQuestion, setNextQuestion] = useState(null)
  const [result, setResult] = useState(null)
  const [reportSummary, setReportSummary] = useState('')
  const [topicProgress, setTopicProgress] = useState({})
  const [agentActivities, setAgentActivities] = useState([])
  const wsRef = useRef(null)

  // WebSocket connection for real-time agent updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/agents/ws')
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'initial') {
        setAgentActivities(data.activities || [])
      } else {
        // New activity received
        setAgentActivities((prev) => [...prev, data])
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      ws.close()
    }
  }, [])

  const activeQuiz = useMemo(() => {
    return topicQuizzes.find((quiz) => quiz.id === activeQuizId) || null
  }, [activeQuizId, topicQuizzes])

  useEffect(() => {
    if (!question || result) return undefined
    const intervalId = setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => clearInterval(intervalId)
  }, [question, result])

  const startSession = async (quizConfig) => {
    if (!quizConfig) return
    if (!user?.id) {
      setError('Please sign in again to continue.')
      return
    }

    console.log('=== Starting Quiz Session ===')
    console.log('Quiz Config:', quizConfig)
    console.log('Topic:', quizConfig.topic)
    console.log('=============================')

    setActiveQuizId(quizConfig.id)
    setLoading(true)
    setError('')
    setFeedback(null)
    setResult(null)
    setReportSummary('')
    setNextQuestion(null)
    setElapsedSeconds(0)
    setSelectedOptionId('')
    setQuestion(null)
    setSessionId(null)
    setQuestionNumber(1)
    setTotalQuestions(0)
    setConfidence(0.6)
    setAgentActivities([]) // Clear old activities

    try {
      const response = await luminaApi.startQuiz({
        user_id: user.id,
        topic: quizConfig.topic,
        target_concepts: quizConfig.targetConcepts,
        num_questions: quizConfig.numQuestions,
        difficulty: quizConfig.difficulty
      })
      console.log('Quiz started, first question:', response.question?.prompt)
      setSessionId(response.session_id)
      setQuestion(response.question)
      setQuestionNumber(response.question_number)
      setTotalQuestions(response.total_questions)
      setSelectedOptionId('')
      // Activities come via WebSocket in real-time
    } catch (apiError) {
      setQuestion(null)
      setSessionId(null)
      setError(apiError?.message || 'Unable to start quiz.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!question || !sessionId || !activeQuiz) return
    if (!selectedOptionId) {
      setError('Please select one option.')
      return
    }

    setSubmitting(true)
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
        const accuracyPercent = toPercent(quizResult.overall_accuracy)

        setResult(quizResult)
        setLatestQuiz(sessionId, quizResult)
        setTopicProgress((prev) => ({
          ...prev,
          [activeQuiz.id]: {
            accuracy: accuracyPercent,
            correctAnswers: Number(quizResult.correct_answers || 0),
            answeredQuestions: Number(quizResult.answered_questions || 0),
            completedAt: new Date().toISOString(),
            sessionId,
            topic: quizResult.topic || activeQuiz.topic,
          },
        }))

        try {
          const generated = await luminaApi.generatePlan({
            user_id: user.id,
            topic: quizResult.topic || activeQuiz.topic,
            weeks: 4,
            quiz_session_id: sessionId,
          })

          addReportHistory({
            id: `${sessionId}_${user.id}_${activeQuiz.id}`,
            createdAt: new Date().toISOString(),
            source: 'adaptive_topic_quiz',
            topic: generated?.plan?.topic || quizResult.topic || activeQuiz.topic,
            quizSessionId: sessionId,
            accuracy: accuracyPercent,
            summary: generated?.gap_report?.summary || '',
            weakConcepts: Array.isArray(generated?.gap_report?.weak_concepts)
              ? generated.gap_report.weak_concepts.map((item) => ({
                  concept: item.concept,
                  weaknessScore: Number(item.weakness_score || 0),
                }))
              : [],
            validationIssues: Array.isArray(generated?.validation?.issues) ? generated.validation.issues : [],
            planWeeks: Array.isArray(generated?.plan?.weeks) ? generated.plan.weeks.length : 0,
            raw: generated,
          })

          setReportSummary(generated?.gap_report?.summary || 'A new progressive report was stored.')
        } catch (planError) {
          setReportSummary(planError?.message || 'Quiz completed. Plan report generation is temporarily unavailable.')
        }
      } else {
        setNextQuestion(answer.next_question)
      }
    } catch (apiError) {
      setError(apiError?.message || 'Could not submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  const moveNext = () => {
    if (!nextQuestion) return
    setQuestion(nextQuestion)
    setNextQuestion(null)
    setFeedback(null)
    setSelectedOptionId('')
    setElapsedSeconds(0)
  }

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const seconds = String(elapsedSeconds % 60).padStart(2, '0')

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto relative z-10 px-6 py-8 overflow-y-auto">
      <section className="glass-panel rounded-[16px] border border-slate-700/50 p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Adaptive Quizzes</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              Topic-wise quizzes generated from your signup profile.
            </p>
            <p className="text-xs mt-2" style={{ color: '#60a5fa' }}>
              Track: {profileSummary.role} | Level: {profileSummary.experience} | {profileSummary.weeklyHours} hrs/week
            </p>
          </div>
          <div className="text-sm font-mono px-3 py-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid #334155', color: '#cbd5e1' }}>
            {minutes}:{seconds}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-blue-300">Generated Topic Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicQuizzes.map((quiz) => {
              const isActive = activeQuizId === quiz.id
              const progress = topicProgress[quiz.id]

              return (
                <article
                  key={quiz.id}
                  className="rounded-[12px] p-4"
                  style={{
                    background: isActive ? 'rgba(30,58,138,0.25)' : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${isActive ? 'rgba(96,165,250,0.5)' : 'rgba(51,65,85,0.7)'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-base">{quiz.topic}</h3>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        Difficulty: {quiz.difficulty} | Questions: {quiz.numQuestions}
                      </p>
                    </div>
                    <span
                      className="text-[11px] px-2 py-1 rounded-full font-medium"
                      style={{
                        background: progress ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)',
                        color: progress ? '#6ee7b7' : '#60a5fa',
                        border: progress ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(59,130,246,0.3)',
                      }}
                    >
                      {progress ? `Completed ${progress.accuracy}%` : 'Ready'}
                    </span>
                  </div>

                  {progress && (
                    <p className="text-xs mt-2" style={{ color: '#cbd5e1' }}>
                      Last score: {progress.correctAnswers}/{progress.answeredQuestions}
                    </p>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => startSession(quiz)}
                      disabled={loading || submitting}
                      className="primary-btn rounded-[9px] px-4 py-2 text-xs font-semibold text-white"
                    >
                      {progress ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="space-y-6 rounded-[12px] p-5" style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(51,65,85,0.7)' }}>
          <div>
            <h2 className="text-lg text-white font-semibold">Quiz Workspace</h2>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              {activeQuiz ? `Now practicing: ${activeQuiz.topic}` : 'Choose a topic quiz above to begin.'}
            </p>
          </div>

          {loading && <p className="text-sm text-blue-300">Starting adaptive quiz...</p>}

          {!loading && error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-200" style={{ background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.5)' }}>
              {error}
            </div>
          )}

          {!loading && !result && !question && !error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(51,65,85,0.6)', color: '#cbd5e1' }}>
              Select and start any generated topic quiz to load questions here.
            </div>
          )}

          {agentActivities.length > 0 && (
            <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(51,65,85,0.6)' }}>
              <AgentActivityFeed activities={agentActivities} />
            </div>
          )}

          {!loading && !result && question && (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Question {questionNumber} of {totalQuestions}</p>
                <h3 className="text-lg text-white font-medium">{question.prompt}</h3>
                <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                  Topic: {question.topic || activeQuiz?.topic} | Difficulty: {question.difficulty}
                </p>
              </div>

              <div className="space-y-3">
                {(Array.isArray(question.options) ? question.options : []).map((option) => (
                  <label key={option.option_id} className={`selectable-card rounded-[10px] p-4 flex items-start gap-3 cursor-pointer ${selectedOptionId === option.option_id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="adaptive_option"
                      value={option.option_id}
                      checked={selectedOptionId === option.option_id}
                      onChange={() => setSelectedOptionId(option.option_id)}
                      className="mt-1"
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <span className="text-sm" style={{ color: '#e2e8f0' }}>{option.text}</span>
                  </label>
                ))}
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>Confidence</p>
                <div className="flex gap-2">
                  {confidenceOptions.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setConfidence(item.value)}
                      className="px-3 py-2 rounded-md text-xs font-medium"
                      style={{
                        background: confidence === item.value ? 'rgba(59,130,246,0.2)' : '#1e293b',
                        border: `1px solid ${confidence === item.value ? 'rgba(59,130,246,0.5)' : '#334155'}`,
                        color: confidence === item.value ? '#60a5fa' : '#cbd5e1',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {feedback && (
                <div className="rounded-lg p-4" style={{ background: feedback.is_correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${feedback.is_correct ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                  <p className={`text-sm font-medium mb-2 ${feedback.is_correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {feedback.is_correct ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-sm" style={{ color: '#cbd5e1' }}>{feedback.explanation}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!nextQuestion && (
                  <button onClick={submitAnswer} disabled={submitting} className="primary-btn rounded-[10px] px-6 py-2.5 text-sm font-semibold text-white">
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                )}
                {nextQuestion && (
                  <button onClick={moveNext} className="primary-btn rounded-[10px] px-6 py-2.5 text-sm font-semibold text-white">
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}

          {result && activeQuiz && (
            <div className="space-y-5">
              <div className="rounded-lg p-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <h3 className="text-xl font-semibold text-white mb-2">{activeQuiz.topic} Quiz Complete</h3>
                <p className="text-sm mb-2" style={{ color: '#cbd5e1' }}>
                  Accuracy: <span className="text-blue-300 font-semibold">{toPercent(result.overall_accuracy)}%</span> ({result.correct_answers}/{result.answered_questions})
                </p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>{reportSummary || 'Your report is ready and stored in history.'}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => startSession(activeQuiz)} className="primary-btn rounded-[10px] px-6 py-2.5 text-sm font-semibold text-white">
                  Retry {activeQuiz.topic}
                </button>
                <Link to="/progress" className="secondary-btn rounded-[10px] px-6 py-2.5 text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                  View Progress History
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default AdaptiveQuizPage
