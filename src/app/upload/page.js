'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function UploadPage() {
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !title) {
      setMessage('Please provide a title and select a file.')
      return
    }

    setUploading(true)
    setMessage('')

    // Path format: userId/timestamp_filename — this matches our storage policy
    const filePath = `${user.id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(filePath, file)

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`)
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
      setMessage(`Database error: ${insertError.message}`)
    } else {
      setMessage('Upload successful! Processing note with AI...')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        await fetch(`${apiUrl}/process/${noteData.id}`, { method: 'POST' })
        setMessage('Note processed successfully!')
      } catch (err) {
        console.error('Processing error:', err)
        setMessage('Upload successful! Note placed in processing queue.')
      }
      setTitle('')
      setFile(null)
      if (e.target && e.target.reset) e.target.reset()
    }

    setUploading(false)
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
    <div style={{ padding: '30px', maxWidth: '550px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '24px', padding: '30px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0' }}>
          📄 Upload a Note
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>
          Upload a PDF and our AI will extract, summarize, and generate quiz questions.
        </p>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Note Title</label>
            <input
              type="text"
              placeholder="e.g. Chapter 5 - Machine Learning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>PDF File</label>
            <div style={{ padding: '16px', backgroundColor: '#0f172a', border: '2px dashed #334155', borderRadius: '8px', textAlign: 'center' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: uploading ? '#475569' : '#0070f3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: uploading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.3px'
            }}
          >
            {uploading ? '⏳ Uploading...' : '🚀 Upload & Process'}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '16px', color: '#22c55e', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}