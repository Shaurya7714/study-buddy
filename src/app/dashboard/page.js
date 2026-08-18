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
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Study Buddy Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Logged in as: {user?.email}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Flame streak badge */}
          <div style={{ padding: '6px 14px', backgroundColor: '#fffaf0', border: '1px solid #feebc8', borderRadius: '20px', fontWeight: 'bold', color: '#dd6b20', fontSize: '14px' }}>
            🔥 {streak.streak} Day Streak
          </div>

          <button
            onClick={() => router.push('/upload')}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            + Upload Note
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Due Review Banner */}
      {dueCount > 0 && (
        <div style={{ marginBottom: '25px', padding: '15px 20px', backgroundColor: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#2b6cb0' }}>🔁 {dueCount} Questions Due for Review Today!</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#4a5568' }}>SM-2 Spaced Repetition algorithms recommend reviewing these now for long-term retention.</p>
          </div>
          <Link href="/review" style={{ padding: '8px 16px', backgroundColor: '#3182ce', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
            Start Review &rarr;
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f7fafc' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{stats.totalNotes}</h3>
          <span style={{ color: '#4a5568', fontSize: '14px' }}>Notes Uploaded</span>
        </div>
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f7fafc' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{stats.totalAttempts}</h3>
          <span style={{ color: '#4a5568', fontSize: '14px' }}>Quiz Questions Answered</span>
        </div>
        <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f7fafc' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{stats.accuracy}%</h3>
          <span style={{ color: '#4a5568', fontSize: '14px' }}>Overall Accuracy</span>
        </div>
      </section>

      {/* Charts Section */}
      {attempts.length > 0 && (
        <RechartsComponents attempts={attempts} />
      )}

      {/* Notes List */}
      <section>
        <h2>Your Study Notes</h2>
        {notes.length === 0 ? (
          <p style={{ color: '#666' }}>No notes uploaded yet. Click "+ Upload Note" above to get started.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notes.map(note => (
              <div
                key={note.id}
                style={{
                  padding: '15px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{note.title}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>
                    Uploaded: {new Date(note.created_at).toLocaleDateString()} &bull; Status: {' '}
                    <span style={{
                      fontWeight: 'bold',
                      color: note.status === 'ready' || note.status === 'summarized' ? 'green' : note.status === 'error' ? 'red' : 'orange'
                    }}>
                      {note.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/notes/${note.id}`}
                    style={{ padding: '6px 12px', backgroundColor: '#4a5568', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
                  >
                    View Details & Summary
                  </Link>
                  <Link
                    href={`/quiz/${note.id}`}
                    style={{ padding: '6px 12px', backgroundColor: '#319795', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
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