'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar({ user, streak = 0 }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Progress & Analytics', path: '/progress', icon: '📈' },
    { label: 'Study Time', path: '/study-time', icon: '⏱️' },
    { label: 'Upload Note', path: '/upload', icon: '📤' },
    { label: 'Review', path: '/review', icon: '🔁' },
  ]

  return (
    <header style={{
      backgroundColor: '#12121a',
      borderBottom: '1px solid #1e1e2e',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}>
            📚
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.3px' }}>Study Buddy</span>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Learning Suite</span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map(item => {
            const isActive = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818cf8' : '#8b8fa3',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Streak pill */}
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            backgroundColor: '#1c1917',
            color: '#fbbf24',
            border: '1px solid #44403c',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ animation: 'pulse-flame 2s ease-in-out infinite' }}>🔥</span>
            <span>{streak} Day Streak</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              backgroundColor: '#1c1917',
              color: '#f87171',
              border: '1px solid #44403c',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  )
}
