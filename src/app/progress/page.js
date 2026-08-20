'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'

const RechartsComponents = dynamic(() => import('../dashboard/DashboardCharts'), { ssr: false })

export default function ProgressPage() {
  const [user, setUser] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [stats, setStats] = useState({ totalAttempts: 0, correctCount: 0, incorrectCount: 0, accuracy: 0 })
  const [streak, setStreak] = useState({ streak: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Fetch user quiz attempts with question info
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*, quiz_questions(question)')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false })

      const attemptsList = attemptsData || []
      setAttempts(attemptsList)

      if (attemptsList.length > 0) {
        const correct = attemptsList.filter(a => a.is_correct).length
        const incorrect = attemptsList.length - correct
        const acc = Math.round((correct / attemptsList.length) * 100)
        setStats({
          totalAttempts: attemptsList.length,
          correctCount: correct,
          incorrectCount: incorrect,
          accuracy: acc
        })
      }

      // Fetch streak
      try {
        const streakRes = await fetch(`${apiUrl}/streak/${user.id}`)
        const streakData = await streakRes.json()
        if (streakData && streakData.streak !== undefined) {
          setStreak(streakData)
        }
      } catch (err) {
        console.error('Error fetching streak:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <Navbar user={user} streak={0} />
        <div className="bento-grid" style={{ paddingTop: '24px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bento-skeleton" style={{ height: i < 4 ? '130px' : '220px', gridColumn: i < 4 ? 'span 1' : 'span 2' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
      <Navbar user={user} streak={streak.streak} />

      <main className="bento-grid">
        {/* Page Header */}
        <div className="bento-card bento-hero bento-span-4" style={{ padding: '24px 28px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            ANALYTICAL DASHBOARD
          </p>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900, color: '#f8fafc' }}>
            📈 Your Learning Progress & Analytics
          </h1>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
            Detailed breakdown of your quiz performance, accuracy trends over time, and retention history.
          </p>
        </div>

        {/* Key Stats Row */}
        <div className="bento-card bento-stat bento-stat-teal">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-title">Overall Accuracy</div>
        </div>

        <div className="bento-card bento-stat bento-stat-purple">
          <div className="stat-value">{stats.totalAttempts}</div>
          <div className="stat-title">Total Questions</div>
        </div>

        <div className="bento-card bento-stat bento-stat-blue">
          <div className="stat-value">{stats.correctCount}</div>
          <div className="stat-title">Correct Answers</div>
        </div>

        <div className="bento-card bento-stat" style={{ border: '1px solid #3b0764' }}>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats.incorrectCount}
          </div>
          <div className="stat-title">Incorrect Answers</div>
        </div>

        {/* Charts */}
        {attempts.length > 0 ? (
          <RechartsComponents attempts={attempts} />
        ) : (
          <div className="bento-card bento-span-4" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '36px', margin: '0 0 10px 0' }}>📊</p>
            <h3 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontWeight: 800 }}>No Quiz Attempt Data Yet</h3>
            <p style={{ margin: 0, color: '#8b8fa3', fontWeight: 600, fontSize: '14px' }}>
              Take a quiz from your Study Notes to populate real-time accuracy and progress charts!
            </p>
          </div>
        )}

        {/* Attempt History Log */}
        <div className="bento-card bento-span-4" style={{ padding: '28px' }}>
          <h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
            📜 Recent Quiz Attempts History
          </h2>

          {attempts.length === 0 ? (
            <p style={{ color: '#8b8fa3', fontWeight: 600 }}>No recent quiz attempts found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {attempts.slice(0, 10).map((a, idx) => (
                <div
                  key={a.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    backgroundColor: '#12121a',
                    border: '1px solid #1e1e2e',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#f8fafc', fontWeight: 700, fontSize: '14px' }}>
                      {a.quiz_questions?.question || `Question #${a.question_id?.substring(0, 8)}`}
                    </p>
                    <span style={{ fontSize: '12px', color: '#8b8fa3', fontWeight: 600 }}>
                      Attempted: {new Date(a.attempted_at).toLocaleString()}
                    </span>
                  </div>

                  <span style={{
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    backgroundColor: a.is_correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.is_correct ? '#34d399' : '#f87171',
                    border: a.is_correct ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    flexShrink: 0
                  }}>
                    {a.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
