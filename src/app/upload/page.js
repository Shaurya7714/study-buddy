'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h1>Upload a Note</h1>
      <form onSubmit={handleUpload}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button type="submit" disabled={uploading} style={{ padding: '8px 16px' }}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      <p style={{ marginTop: '10px' }}>{message}</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: '20px' }}>
        Back to Dashboard
      </button>
    </div>
  )
}