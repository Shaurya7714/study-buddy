'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import PomodoroTimer from '@/components/PomodoroTimer'
import TodoList from '@/components/TodoList'

export default function StudyTimePage() {
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        const streakRes = await fetch(`${apiUrl}/streak/${user.id}`)
        const streakData = await streakRes.json()
        if (streakData && streakData.streak !== undefined) {
          setStreak(streakData.streak)
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }

    fetchUser()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <Navbar user={user} streak={0} />
        <p style={{ padding: '30px', color: '#f8fafc', fontWeight: 700, textAlign: 'center' }}>Loading Study Time Zone...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
      <Navbar user={user} streak={streak} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        {/* Banner */}
        <div className="bento-card bento-hero" style={{ marginBottom: '24px', padding: '24px 28px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            PRODUCTIVITY & FOCUS SUITE
          </p>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 900, color: '#f8fafc' }}>
            ⏱️ Study Time Workspace
          </h1>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
            Use the retro Pomodoro timer to maintain deep focus intervals, and track your daily study tasks with the interactive To-Do List.
          </p>
        </div>

        {/* Widgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Pomodoro Timer Widget */}
          <div>
            <PomodoroTimer />
          </div>

          {/* To-Do List Widget */}
          <div>
            <TodoList />
          </div>
        </div>
      </main>
    </div>
  )
}
