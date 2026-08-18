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

  if (loading) return <p style={{ padding: '20px' }}>Loading Spaced Repetition Review...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#0070f3' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>🔁 Spaced Repetition Review (SM-2)</h1>
        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Smart memory review tailored to your recall history</p>
      </div>

      {dueQuestions.length === 0 ? (
        <div style={{ padding: '30px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ color: '#276749', margin: '0 0 10px 0' }}>🎉 You're all caught up!</h2>
          <p style={{ color: '#2f855a' }}>No questions are due for review right now. Check back tomorrow!</p>
          <Link href="/dashboard" style={{ display: 'inline-block', marginTop: '15px', padding: '8px 16px', backgroundColor: '#2f855a', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            Return to Dashboard
          </Link>
        </div>
      ) : finished ? (
        <div style={{ padding: '30px', backgroundColor: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ color: '#2b6cb0', margin: '0 0 10px 0' }}>Review Completed!</h2>
          <p style={{ fontSize: '18px', color: '#2d3748' }}>
            Score: <strong>{score} / {dueQuestions.length}</strong> ({Math.round((score / dueQuestions.length) * 100)}%)
          </p>
          <p style={{ color: '#4a5568' }}>Your memory intervals have been recalculated by the SM-2 algorithm.</p>
          <Link href="/dashboard" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', backgroundColor: '#3182ce', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ padding: '25px', border: '1px solid #cbd5e0', borderRadius: '8px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#718096' }}>
            <span>Question {currentIndex + 1} of {dueQuestions.length}</span>
            <span>Due Today</span>
          </div>

          <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#2d3748' }}>
            {currentQ?.question}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {(currentQ?.options || [currentQ?.correct_answer]).map((opt, oIdx) => {
              const isSelected = selectedOption === opt
              const isCorrectOpt = opt.toLowerCase() === currentQ?.correct_answer.toLowerCase()

              let bg = '#f7fafc'
              let border = '#cbd5e0'

              if (isAnswered) {
                if (isCorrectOpt) {
                  bg = '#c6f6d5'
                  border = '#38a169'
                } else if (isSelected && !isCorrectOpt) {
                  bg = '#fed7d7'
                  border = '#e53e3e'
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleAnswer(opt)}
                  disabled={isAnswered}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    border: `2px solid ${border}`,
                    backgroundColor: bg,
                    cursor: isAnswered ? 'default' : 'pointer',
                    fontWeight: isSelected || (isAnswered && isCorrectOpt) ? 'bold' : 'normal'
                  }}
                >
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </button>
              )
            })}
          </div>

          {isAnswered && (
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#319795',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer'
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
