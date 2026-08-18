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

  if (loading) return <p style={{ padding: '20px' }}>Loading Quiz...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#0070f3' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Multiple-Choice Quiz</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Select the correct answer for each question</p>
        </div>
        <button
          onClick={generateQuizQuestions}
          disabled={generating}
          style={{ padding: '8px 14px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {generating ? 'Regenerating...' : 'Regenerate Questions'}
        </button>
      </div>

      {message && <p style={{ color: '#d69e2e', marginTop: '10px' }}>{message}</p>}

      {questions.length === 0 ? (
        <div style={{ marginTop: '30px', textAlign: 'center', padding: '30px', border: '1px dashed #cbd5e0', borderRadius: '8px' }}>
          <p>No questions generated yet.</p>
          <button
            onClick={generateQuizQuestions}
            disabled={generating}
            style={{ padding: '10px 20px', backgroundColor: '#319795', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {generating ? 'Generating Questions...' : 'Generate Quiz Questions'}
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
              <div key={q.id} style={{ marginBottom: '25px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ fontWeight: '600', fontSize: '16px', margin: '0 0 15px 0', color: '#2d3748' }}>
                  {idx + 1}. {q.question}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {options.map((opt, oIdx) => {
                    const optionLetter = String.fromCharCode(65 + oIdx)
                    const isSelected = selectedOpt === opt
                    const isCorrectOpt = opt.toLowerCase() === q.correct_answer.toLowerCase()

                    let btnBg = '#f7fafc'
                    let btnBorder = '#cbd5e0'
                    let btnColor = '#2d3748'

                    if (isSelected) {
                      btnBg = '#ebf8ff'
                      btnBorder = '#3182ce'
                      btnColor = '#2b6cb0'
                    }

                    if (submitted) {
                      if (isCorrectOpt) {
                        btnBg = '#c6f6d5'
                        btnBorder = '#38a169'
                        btnColor = '#22543d'
                      } else if (isSelected && !isCorrectOpt) {
                        btnBg = '#fed7d7'
                        btnBorder = '#e53e3e'
                        btnColor = '#9b2c2c'
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={submitted}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          borderRadius: '6px',
                          border: `2px solid ${btnBorder}`,
                          backgroundColor: btnBg,
                          color: btnColor,
                          fontWeight: isSelected || (submitted && isCorrectOpt) ? 'bold' : 'normal',
                          cursor: submitted ? 'default' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ marginRight: '8px', opacity: 0.7 }}>{optionLetter}.</span>
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
                backgroundColor: Object.keys(selectedAnswers).length > 0 ? '#319795' : '#a0aec0',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: Object.keys(selectedAnswers).length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Multiple-Choice Answers
            </button>
          ) : (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#276749' }}>
                Quiz Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </h2>
              <p style={{ color: '#2f855a' }}>✨ Spaced repetition intervals updated! Your memory retention score has been adjusted.</p>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setSelectedAnswers({}) }}
                style={{ padding: '8px 16px', backgroundColor: '#2f855a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
              >
                Retake Quiz
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
