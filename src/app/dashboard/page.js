'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading Dashboard...</p>

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #475569', paddingBottom: '14px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', fontWeight: 900 }}>Study Buddy Dashboard</h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Logged in as: <strong style={{ color: '#f8fafc', fontWeight: 800 }}>{user?.email}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Flame streak badge */}
          <div style={{ padding: '6px 14px', backgroundColor: '#78350f', border: '1px solid #b45309', borderRadius: '20px', fontWeight: 800, color: '#fbbf24', fontSize: '14px' }}>
            🔥 {streak.streak} Day Streak
          </div>

          <button
            onClick={() => router.push('/upload')}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '14px' }}
          >
            + Upload Note
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '14px' }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Due Review Banner */}
      {dueCount > 0 && (
        <div style={{ marginBottom: '25px', padding: '18px 22px', backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#93c5fd', fontWeight: 800, fontSize: '16px' }}>🔁 {dueCount} Questions Due for Review Today!</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#bfdbfe', fontWeight: 600 }}>SM-2 Spaced Repetition algorithms recommend reviewing these now for long-term retention.</p>
          </div>
          <Link href="/review" style={{ padding: '10px 18px', backgroundColor: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '14px' }}>
            Start Review &rarr;
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 15px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0f172a', fontSize: '36px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>{stats.totalNotes}</h3>
          <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700, display: 'block' }}>Notes Uploaded</span>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 15px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0f172a', fontSize: '36px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>{stats.totalAttempts}</h3>
          <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700, display: 'block' }}>Quiz Questions Answered</span>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 15px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0f172a', fontSize: '36px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>{stats.accuracy}%</h3>
          <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700, display: 'block' }}>Overall Accuracy</span>
        </div>
      </section>

      {/* Charts Section */}
      {attempts.length > 0 && (
        <RechartsComponents attempts={attempts} />
      )}

      {/* Notes List */}
      <section>
        <h2 style={{ color: '#f8fafc', fontSize: '22px', fontWeight: 900, marginBottom: '16px' }}>Your Study Notes</h2>
        {notes.length === 0 ? (
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No notes uploaded yet. Click "+ Upload Note" above to get started.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map(note => (
              <div
                key={note.id}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontWeight: 800, color: '#f8fafc', fontSize: '16px' }}>{note.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                    Uploaded: {new Date(note.created_at).toLocaleDateString()} &bull; Status:{' '}
                    <span style={{
                      fontWeight: 800,
                      color: note.status === 'ready' || note.status === 'summarized' ? '#34d399' : note.status === 'error' ? '#ef4444' : '#fbbf24'
                    }}>
                      {note.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/notes/${note.id}`}
                    style={{ padding: '8px 14px', backgroundColor: '#334155', color: '#f8fafc', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                  >
                    View Details & Summary
                  </Link>
                  <Link
                    href={`/quiz/${note.id}`}
                    style={{ padding: '8px 14px', backgroundColor: '#0d9488', color: '#ffffff', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                  >
                    Take Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}