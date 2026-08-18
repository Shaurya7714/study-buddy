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
  const [answers, setAnswers] = useState({})
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

      // Fetch existing questions
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('note_id', noteId)

      if (questionData && questionData.length > 0) {
        setQuestions(questionData)
      } else {
        // Try generating questions via API
        await generateQuizQuestions()
      }
      setLoading(false)
    }

    loadQuiz()
  }, [noteId, router])

  const generateQuizQuestions = async () => {
    setGenerating(true)
    setMessage('Generating quiz questions from note...')
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

  const handleInputChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (questions.length === 0) return

    let correctCount = 0
    const attemptInserts = []

    for (const q of questions) {
      const userAnswer = (answers[q.id] || '').trim().toLowerCase()
      const isCorrect = userAnswer === q.correct_answer.toLowerCase()
      if (isCorrect) correctCount++

      attemptInserts.push({
        user_id: user.id,
        question_id: q.id,
        is_correct: isCorrect
      })
    }

    // Insert attempts into Supabase
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
        <h1 style={{ margin: 0 }}>Practice Quiz</h1>
        <button
          onClick={generateQuizQuestions}
          disabled={generating}
          style={{ padding: '6px 12px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
            const userAnswer = (answers[q.id] || '').trim()
            const isCorrect = userAnswer.toLowerCase() === q.correct_answer.toLowerCase()

            return (
              <div key={q.id} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f7fafc' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>
                  {idx + 1}. {q.question}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Fill in the blank word..."
                    value={answers[q.id] || ''}
                    disabled={submitted}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    style={{ padding: '8px', flex: '1', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                  />
                  {submitted && (
                    <span style={{
                      fontWeight: 'bold',
                      color: isCorrect ? 'green' : 'red',
                      fontSize: '14px'
                    }}>
                      {isCorrect ? '✓ Correct!' : `✗ Correct answer: "${q.correct_answer}"`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {!submitted ? (
            <button
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#319795', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Submit Quiz Answers
            </button>
          ) : (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#276749' }}>
                Quiz Results: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </h2>
              <p style={{ color: '#2f855a' }}>Your score has been logged to your progress dashboard!</p>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setAnswers({}) }}
                style={{ padding: '8px 16px', backgroundColor: '#2f855a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
              >
                Try Again
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
