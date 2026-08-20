'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const RechartsComponents = dynamic(() => import('./DashboardCharts'), { ssr: false })

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [stats, setStats] = useState({ totalNotes: 0, totalAttempts: 0, accuracy: 0 })
  const [streak, setStreak] = useState({ streak: 0, studied_today: false })
  const [dueCount, setDueCount] = useState(0)
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

      // Fetch user notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      setNotes(notesData || [])

      // Fetch user quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: true })

      setAttempts(attemptsData || [])

      if (attemptsData && attemptsData.length > 0) {
        const correctCount = attemptsData.filter(a => a.is_correct).length
        const acc = Math.round((correctCount / attemptsData.length) * 100)
        setStats({
          totalNotes: notesData?.length || 0,
          totalAttempts: attemptsData.length,
          accuracy: acc
        })
      } else {
        setStats({
          totalNotes: notesData?.length || 0,
          totalAttempts: 0,
          accuracy: 0
        })
      }

      // Fetch streak & due questions from backend API
      try {
        const [streakRes, dueRes] = await Promise.all([
          fetch(`${apiUrl}/streak/${user.id}`),
          fetch(`${apiUrl}/due-questions/${user.id}`)
        ])

        const streakData = await streakRes.json()
        const dueData = await dueRes.json()

        if (streakData && streakData.streak !== undefined) {
          setStreak(streakData)
        }
        if (dueData && dueData.count !== undefined) {
          setDueCount(dueData.count)
        }
      } catch (err) {
        console.error('Error fetching streak or due questions:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <Navbar user={user} streak={0} />
        <div className="bento-grid" style={{ paddingTop: '24px' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bento-skeleton"
              style={{
                gridColumn: i === 0 ? 'span 2' : 'span 1',
                height: i === 0 ? '180px' : '140px'
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
      <Navbar user={user} streak={streak.streak} />

      <main className="bento-grid">
        {/* ROW 1: Hero + Stats */}
        <div className="bento-card bento-hero bento-span-2" style={{ minHeight: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              OVERVIEW DASHBOARD
            </p>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 900, color: '#f8fafc', lineHeight: 1.2 }}>
              {getGreeting()}, <br />
              <span style={{ color: '#93c5fd' }}>{user?.email?.split('@')[0]}</span>
            </h1>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
              {stats.totalNotes} Notes
            </span>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, backgroundColor: 'rgba(20,184,166,0.15)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.3)' }}>
              {stats.totalAttempts} Quizzes
            </span>
          </div>
        </div>

        {/* Notes Count Stat */}
        <div className="bento-card bento-stat bento-stat-blue">
          <div className="stat-value">{stats.totalNotes}</div>
          <div className="stat-title">Notes</div>
        </div>

        {/* Accuracy Stat (Clickable to /progress) */}
        <Link href="/progress" style={{ textDecoration: 'none' }}>
          <div className="bento-card bento-stat bento-stat-teal" style={{ height: '100%' }}>
            <div className="stat-value">{stats.accuracy}%</div>
            <div className="stat-title">Accuracy →</div>
          </div>
        </Link>

        {/* ROW 2: Streak + Quiz + Review */}
        <div className="bento-card bento-streak">
          <div className="streak-flame">🔥</div>
          <div className="streak-count">{streak.streak}</div>
          <div className="streak-label">Day Streak</div>
        </div>

        <Link href="/progress" style={{ textDecoration: 'none' }}>
          <div className="bento-card bento-stat bento-stat-purple" style={{ height: '100%' }}>
            <div className="stat-value">{stats.totalAttempts}</div>
            <div className="stat-title">Analytics →</div>
          </div>
        </Link>

        <Link href="/review" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
          <div className="bento-card bento-review" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Spaced Repetition
                </p>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 900, color: '#f8fafc' }}>
                  🔁 {dueCount > 0 ? `${dueCount} Questions Due` : 'All Caught Up!'}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#818cf8' }}>
                  {dueCount > 0 ? 'SM-2 recommends reviewing now →' : 'Check back tomorrow for reviews'}
                </p>
              </div>
              <div style={{ fontSize: '48px', opacity: 0.3 }}>🧠</div>
            </div>
          </div>
        </Link>

        {/* ROW 3: Charts */}
        {attempts.length > 0 && (
          <RechartsComponents attempts={attempts} />
        )}

        {/* ROW 4: Notes List */}
        <div className="bento-card bento-span-4" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
              📚 Your Study Notes
            </h2>
            <Link href="/upload" style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', textDecoration: 'none' }}>
              + Upload New Note →
            </Link>
          </div>

          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '14px', border: '2px dashed #1e1e2e' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>📝</p>
              <p style={{ color: '#8b8fa3', fontWeight: 700, fontSize: '15px', margin: '0 0 4px 0' }}>No notes uploaded yet</p>
              <p style={{ color: '#4a4e63', fontWeight: 600, fontSize: '13px', margin: 0 }}>Click "Upload Note" below to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {notes.map(note => (
                <div key={note.id} className="bento-note">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#f8fafc', fontSize: '15px', lineHeight: 1.3 }}>
                      {note.title}
                    </h3>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: note.status === 'ready' || note.status === 'summarized'
                        ? 'rgba(16,185,129,0.15)' : note.status === 'error'
                        ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: note.status === 'ready' || note.status === 'summarized'
                        ? '#34d399' : note.status === 'error'
                        ? '#f87171' : '#fbbf24',
                    }}>
                      {note.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#8b8fa3', fontWeight: 600 }}>
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/notes/${note.id}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#1e1e2e',
                        color: '#e2e8f0',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: '1px solid #2a2a3e'
                      }}
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/quiz/${note.id}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: 'none'
                      }}
                    >
                      Take Quiz →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 5: Quick Actions */}
        <div
          className="bento-card bento-action bento-action-upload bento-span-2"
          onClick={() => router.push('/upload')}
        >
          <span className="action-icon">📄</span>
          <span className="action-label">+ Upload New Note</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6ee7b7' }}>PDF Workspace</span>
        </div>

        <div
          className="bento-card bento-action bento-span-2"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid #4338ca' }}
          onClick={() => router.push('/progress')}
        >
          <span className="action-icon">📈</span>
          <span className="action-label">View Progress & Analytics</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a5b4fc' }}>Charts & Attempt History</span>
        </div>
      </main>
    </div>
  )
}