'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function UploadPage() {
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState([])
  const [streak, setStreak] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const fetchUserAndNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    // Fetch notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })

    setNotes(notesData || [])

    // Fetch streak
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
  }

  useEffect(() => {
    fetchUserAndNotes()
  }, [router])

  const handleUpload = async (e) => {
    if (e) e.preventDefault()
    if (!file || !title) {
      setMessage('⚠️ Please provide a note title and select a PDF file.')
      return
    }

    setUploading(true)
    setMessage('')

    const filePath = `${user.id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(filePath, file)

    if (uploadError) {
      setMessage(`❌ Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: noteData, error: insertError } = await supabase.from('notes').insert({
      user_id: user.id,
      title: title,
      file_url: filePath,
      status: 'processing'
    }).select().single()

    if (insertError) {
      setMessage(`❌ Database error: ${insertError.message}`)
    } else {
      setMessage('✨ Upload successful! AI is extracting and summarizing...')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        await fetch(`${apiUrl}/process/${noteData.id}`, { method: 'POST' })
        setMessage('🎉 Note processed successfully!')
      } catch (err) {
        console.error('Processing error:', err)
        setMessage('✅ Upload successful! Note queued for processing.')
      }
      setTitle('')
      setFile(null)
      fetchUserAndNotes()
    }

    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile)
        if (!title) {
          setTitle(droppedFile.name.replace('.pdf', ''))
        }
      } else {
        setMessage('⚠️ Only PDF files are supported.')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
      <Navbar user={user} streak={streak} />

      <main className="bento-grid">
        {/* Upload Container Bento */}
        <div className="bento-card bento-span-4" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              DOCUMENT WORKSPACE
            </p>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 900, color: '#f8fafc' }}>
              📤 Upload & Process Study Notes
            </h1>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
              Upload any course PDF. Our AI pipeline will extract raw text, generate key summaries, and craft multiple-choice practice quizzes automatically.
            </p>
          </div>

          <form onSubmit={handleUpload}>
            {/* Title input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>
                Note Title
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4 - Data Structures & Algorithms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#12121a',
                  border: '1px solid #1e1e2e',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                marginBottom: '24px',
                padding: '36px 20px',
                backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.1)' : '#12121a',
                border: isDragging ? '2px dashed #10b981' : '2px dashed #1e1e2e',
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>
                {file ? '📄' : '📁'}
              </div>
              {file ? (
                <div>
                  <p style={{ color: '#10b981', fontWeight: 800, fontSize: '16px', margin: '0 0 4px 0' }}>
                    Selected File: {file.name}
                  </p>
                  <p style={{ color: '#8b8fa3', fontSize: '13px', margin: 0 }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#f8fafc', fontWeight: 800, fontSize: '16px', margin: '0 0 6px 0' }}>
                    Drag & Drop your PDF file here, or browse
                  </p>
                  <p style={{ color: '#8b8fa3', fontSize: '13px', margin: '0 0 16px 0' }}>
                    Supports PDF documents up to 50MB
                  </p>
                  <label style={{
                    padding: '8px 18px',
                    backgroundColor: '#1e1e2e',
                    color: '#f8fafc',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-block',
                    border: '1px solid #2a2a3e'
                  }}>
                    Browse PDF File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0]
                          setFile(f)
                          if (!title) setTitle(f.name.replace('.pdf', ''))
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              style={{
                width: '100%',
                padding: '16px',
                background: uploading ? '#1e1e2e' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: uploading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
                boxShadow: uploading ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {uploading ? '⏳ Uploading & Processing PDF with AI...' : '🚀 Upload & Process Note'}
            </button>
          </form>

          {message && (
            <p style={{ marginTop: '20px', color: '#fbbf24', fontSize: '14px', fontWeight: 800, textAlign: 'center' }}>
              {message}
            </p>
          )}
        </div>

        {/* Uploaded Notes Directory */}
        <div className="bento-card bento-span-4" style={{ padding: '28px' }}>
          <h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
            📚 Your Uploaded Notes Directory ({notes.length})
          </h2>

          {notes.length === 0 ? (
            <p style={{ color: '#8b8fa3', fontWeight: 600 }}>No uploaded notes yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {notes.map(note => (
                <div key={note.id} className="bento-note">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>
                      {note.title}
                    </h3>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: note.status === 'ready' || note.status === 'summarized' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: note.status === 'ready' || note.status === 'summarized' ? '#34d399' : '#fbbf24'
                    }}>
                      {note.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#8b8fa3', fontWeight: 600 }}>
                    Uploaded: {new Date(note.created_at).toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/notes/${note.id}`}
                      style={{ flex: 1, padding: '8px', backgroundColor: '#1e1e2e', color: '#e2e8f0', textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/quiz/${note.id}`}
                      style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}
                    >
                      Take Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}