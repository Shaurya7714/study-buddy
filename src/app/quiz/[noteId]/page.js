'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function QuizPage() {
  const params = useParams()
  const noteId = params?.noteId
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!noteId) return

    const loadQuiz = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('note_id', noteId)

      if (questionData && questionData.length > 0) {
        setQuestions(questionData)
      } else {
        await generateQuizQuestions()
      }
      setLoading(false)
    }

    loadQuiz()
  }, [noteId, router])

  const generateQuizQuestions = async () => {
    setGenerating(true)
    setMessage('Generating multiple-choice questions...')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${apiUrl}/generate-quiz/${noteId}`, { method: 'POST' })
      if (res.ok) {
        const { data: questionData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('note_id', noteId)
        setQuestions(questionData || [])
        setMessage('')
      } else {
        setMessage('Could not generate questions. Ensure note summary exists.')
      }
    } catch (err) {
      console.error(err)
      setMessage('Failed to connect to Quiz Generator service.')
    }
    setGenerating(false)
  }

  const handleSelectOption = (qId, optionText) => {
    if (submitted) return
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionText }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (questions.length === 0) return

    let correctCount = 0
    const attemptInserts = []
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    for (const q of questions) {
      const selected = (selectedAnswers[q.id] || '').trim().toLowerCase()
      const isCorrect = selected === q.correct_answer.toLowerCase()
      if (isCorrect) correctCount++

      attemptInserts.push({
        user_id: user.id,
        question_id: q.id,
        is_correct: isCorrect
      })

      // SM-2 Spaced repetition call (quality = 5 for correct, 1 for incorrect)
      const quality = isCorrect ? 5 : 1
      try {
        fetch(`${apiUrl}/review/${user.id}/${q.id}?quality=${quality}`, { method: 'POST' }).catch(() => {})
      } catch (err) {
        console.error('SM-2 Review call failed:', err)
      }
    }

    await supabase.from('quiz_attempts').insert(attemptInserts)

    setScore(correctCount)
    setSubmitted(true)
  }

  if (loading) return <p style={{ padding: '20px', color: '#f8fafc', fontWeight: 700 }}>Loading Quiz...</p>

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', fontWeight: 900 }}>Multiple-Choice Quiz</h1>
          <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontSize: '14px', fontWeight: 600 }}>Select the correct answer for each question</p>
        </div>
        <button
          onClick={generateQuizQuestions}
          disabled={generating}
          style={{
            padding: '10px 16px',
            backgroundColor: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px'
          }}
        >
          {generating ? '⏳ Regenerating...' : '🔄 Regenerate Questions'}
        </button>
      </div>

      {message && <p style={{ color: '#fbbf24', marginTop: '12px', fontWeight: 700, fontSize: '14px' }}>{message}</p>}

      {questions.length === 0 ? (
        <div style={{ marginTop: '30px', textAlign: 'center', padding: '40px', border: '2px dashed #334155', borderRadius: '12px', backgroundColor: '#1e293b' }}>
          <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>No questions generated yet.</p>
          <button
            onClick={generateQuizQuestions}
            disabled={generating}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '15px'
            }}
          >
            {generating ? '⏳ Generating Questions...' : '🚀 Generate Quiz Questions'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
          {questions.map((q, idx) => {
            const selectedOpt = selectedAnswers[q.id]
            const options = q.options && Array.isArray(q.options) && q.options.length > 0
              ? q.options
              : [q.correct_answer]

            return (
              <div key={q.id} style={{ marginBottom: '20px', padding: '24px', border: '1px solid #334155', borderRadius: '14px', backgroundColor: '#1e293b', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                <p style={{ fontWeight: 800, fontSize: '17px', margin: '0 0 16px 0', color: '#f8fafc', lineHeight: 1.5 }}>
                  {idx + 1}. {q.question}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {options.map((opt, oIdx) => {
                    const optionLetter = String.fromCharCode(65 + oIdx)
                    const isSelected = selectedOpt === opt
                    const isCorrectOpt = opt.toLowerCase() === q.correct_answer.toLowerCase()

                    let btnBg = '#0f172a'
                    let btnBorder = '#334155'
                    let btnColor = '#f8fafc'

                    if (isSelected) {
                      btnBg = '#1e3a8a'
                      btnBorder = '#3b82f6'
                      btnColor = '#ffffff'
                    }

                    if (submitted) {
                      if (isCorrectOpt) {
                        btnBg = '#064e3b'
                        btnBorder = '#10b981'
                        btnColor = '#ecfdf5'
                      } else if (isSelected && !isCorrectOpt) {
                        btnBg = '#7f1d1d'
                        btnBorder = '#ef4444'
                        btnColor = '#fef2f2'
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={submitted}
                        style={{
                          padding: '14px 16px',
                          textAlign: 'left',
                          borderRadius: '10px',
                          border: `2px solid ${btnBorder}`,
                          backgroundColor: btnBg,
                          color: btnColor,
                          fontWeight: isSelected || (submitted && isCorrectOpt) ? 800 : 600,
                          cursor: submitted ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '14px'
                        }}
                      >
                        <span style={{ marginRight: '8px', color: '#38bdf8', fontWeight: 800 }}>{optionLetter}.</span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!submitted ? (
            <button
              type="submit"
              disabled={Object.keys(selectedAnswers).length === 0}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: Object.keys(selectedAnswers).length > 0 ? '#0d9488' : '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: Object.keys(selectedAnswers).length > 0 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.3px'
              }}
            >
              Submit Multiple-Choice Answers
            </button>
          ) : (
            <div style={{ marginTop: '20px', padding: '28px', backgroundColor: '#064e3b', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#34d399', fontSize: '22px', fontWeight: 900 }}>
                Quiz Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </h2>
              <p style={{ color: '#a7f3d0', fontWeight: 600 }}>✨ Spaced repetition intervals updated! Your memory retention score has been adjusted.</p>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setSelectedAnswers({}) }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '12px',
                  fontWeight: 800,
                  fontSize: '15px'
                }}
              >
                🔄 Retake Quiz
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
