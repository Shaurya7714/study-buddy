'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Signup successful! Check your email to confirm, or just log in if confirmation is disabled.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
      }
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '15px',
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0', textAlign: 'center' }}>
          📚 Study Buddy
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600, textAlign: 'center', margin: '0 0 30px 0' }}>
          {isSignUp ? 'Create your account' : 'Welcome back! Log in to continue'}
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#0070f3',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '0.3px'
          }}>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '16px', color: '#fbbf24', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
            {message}
          </p>
        )}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}