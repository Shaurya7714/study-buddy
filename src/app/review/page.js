'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ReviewPage() {
  const [user, setUser] = useState(null)
  const [dueQuestions, setDueQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDue = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        const res = await fetch(`${apiUrl}/due-questions/${user.id}`)
        const data = await res.json()
        if (data.status === 'ok' && data.questions) {
          setDueQuestions(data.questions)
        }
      } catch (err) {
        console.error('Failed to fetch due questions:', err)
      }
      setLoading(false)
    }

    fetchDue()
  }, [router])

  const currentItem = dueQuestions[currentIndex]
  const currentQ = currentItem?.quiz_questions

  const handleAnswer = async (option) => {
    if (isAnswered || !currentQ) return
    setSelectedOption(option)
    setIsAnswered(true)

    const isCorrect = option.toLowerCase() === currentQ.correct_answer.toLowerCase()
    if (isCorrect) setScore(prev => prev + 1)

    const quality = isCorrect ? 5 : 1
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      await fetch(`${apiUrl}/review/${user.id}/${currentQ.id}?quality=${quality}`, { method: 'POST' })
    } catch (err) {
      console.error(err)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < dueQuestions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption('')
      setIsAnswered(false)
    } else {
      setFinished(true)
    }
  }

  if (loading) return <p style={{ padding: '20px', color: '#f8fafc', fontWeight: 700 }}>Loading Spaced Repetition Review...</p>

  return (
    <div style={{ padding: '30px', maxWidth: '650px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', fontWeight: 900 }}>🔁 Spaced Repetition Review (SM-2)</h1>
        <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontWeight: 600, fontSize: '14px' }}>Smart memory review tailored to your recall history</p>
      </div>

      {dueQuestions.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: '#064e3b', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: '#34d399', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 900 }}>🎉 You're all caught up!</h2>
          <p style={{ color: '#a7f3d0', fontWeight: 600 }}>No questions are due for review right now. Check back tomorrow!</p>
          <Link href="/dashboard" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', backgroundColor: '#10b981', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 800 }}>
            Return to Dashboard
          </Link>
        </div>
      ) : finished ? (
        <div style={{ padding: '40px', backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: '#93c5fd', margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900 }}>Review Completed!</h2>
          <p style={{ fontSize: '20px', color: '#f8fafc', fontWeight: 800 }}>
            Score: {score} / {dueQuestions.length} ({Math.round((score / dueQuestions.length) * 100)}%)
          </p>
          <p style={{ color: '#bfdbfe', fontWeight: 600 }}>Your memory intervals have been recalculated by the SM-2 algorithm.</p>
          <Link href="/dashboard" style={{ display: 'inline-block', marginTop: '15px', padding: '12px 24px', backgroundColor: '#3b82f6', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 800 }}>
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ padding: '28px', border: '1px solid #334155', borderRadius: '14px', backgroundColor: '#1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '13px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 700 }}>Question {currentIndex + 1} of {dueQuestions.length}</span>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>Due Today</span>
          </div>

          <h3 style={{ fontSize: '18px', margin: '0 0 22px 0', color: '#f8fafc', fontWeight: 800, lineHeight: 1.5 }}>
            {currentQ?.question}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {(currentQ?.options || [currentQ?.correct_answer]).map((opt, oIdx) => {
              const isSelected = selectedOption === opt
              const isCorrectOpt = opt.toLowerCase() === currentQ?.correct_answer.toLowerCase()

              let bg = '#0f172a'
              let border = '#334155'
              let textCol = '#f8fafc'

              if (isAnswered) {
                if (isCorrectOpt) {
                  bg = '#064e3b'
                  border = '#10b981'
                  textCol = '#ecfdf5'
                } else if (isSelected && !isCorrectOpt) {
                  bg = '#7f1d1d'
                  border = '#ef4444'
                  textCol = '#fef2f2'
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleAnswer(opt)}
                  disabled={isAnswered}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    borderRadius: '10px',
                    border: `2px solid ${border}`,
                    backgroundColor: bg,
                    color: textCol,
                    cursor: isAnswered ? 'default' : 'pointer',
                    fontWeight: isSelected || (isAnswered && isCorrectOpt) ? 800 : 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ color: '#38bdf8', marginRight: '8px', fontWeight: 800 }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                </button>
              )
            })}
          </div>

          {isAnswered && (
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '16px',
                cursor: 'pointer',
                letterSpacing: '0.3px'
              }}
            >
              {currentIndex + 1 < dueQuestions.length ? 'Next Question →' : 'Finish Review'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
