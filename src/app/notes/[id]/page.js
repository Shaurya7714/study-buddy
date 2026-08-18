'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function NoteDetailPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()

  const [note, setNote] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reprocessing, setReprocessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchNoteAndSummary = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch Note details
      const { data: noteData, error: noteErr } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

      if (noteErr || !noteData) {
        setErrorMsg('Note not found or permission denied.')
        setLoading(false)
        return
      }

      setNote(noteData)

      // Fetch Summary details
      const { data: summaryData } = await supabase
        .from('summaries')
        .select('*')
        .eq('note_id', id)
        .single()

      if (summaryData) {
        setSummary(summaryData)
      }

      setLoading(false)
    }

    fetchNoteAndSummary()
  }, [id, router])

  const handleReprocess = async () => {
    setReprocessing(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${apiUrl}/process/${id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const { data: noteData } = await supabase.from('notes').select('*').eq('id', id).single()
        const { data: summaryData } = await supabase.from('summaries').select('*').eq('note_id', id).single()
        setNote(noteData)
        setSummary(summaryData)
      } else {
        alert(`Reprocessing error: ${data.detail || 'Failed to process note'}`)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to processing server.')
    }
    setReprocessing(false)
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading note details...</p>

  if (errorMsg) return (
    <div style={{ padding: '20px' }}>
      <p style={{ color: 'red' }}>{errorMsg}</p>
      <Link href="/dashboard">Back to Dashboard</Link>
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#0070f3' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{note.title}</h1>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: note.status === 'ready' || note.status === 'summarized' ? '#c6f6d5' : '#feebc8',
          color: note.status === 'ready' || note.status === 'summarized' ? '#22543d' : '#744210'
        }}>
          STATUS: {note.status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleReprocess}
          disabled={reprocessing}
          style={{ padding: '8px 16px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {reprocessing ? 'Reprocessing...' : 'Re-run Summarizer & Quiz Generator'}
        </button>
        <Link
          href={`/quiz/${note.id}`}
          style={{ padding: '8px 16px', backgroundColor: '#319795', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}
        >
          Take Quiz &rarr;
        </Link>
      </div>

      {/* AI Summary Card */}
      <section style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '8px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#2b6cb0' }}>✨ AI Key Takeaways Summary</h2>
        {summary ? (
          <p style={{ lineHeight: '1.6', fontSize: '16px', color: '#2d3748', margin: 0 }}>
            {summary.summary_text}
          </p>
        ) : (
          <p style={{ color: '#718096', margin: 0 }}>
            Summary is being generated or hasn't been created yet. Click "Re-run Summarizer" above if needed.
          </p>
        )}
      </section>

      {/* Raw Extracted Text */}
      <section style={{ marginTop: '30px' }}>
        <h2>Raw Extracted Text</h2>
        <div style={{
          padding: '15px',
          backgroundColor: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          maxHeight: '300px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '13px',
          whiteSpace: 'pre-wrap'
        }}>
          {note.raw_text || 'No extracted text found. Ensure text extraction completed successfully.'}
        </div>
      </section>
    </div>
  )
}
