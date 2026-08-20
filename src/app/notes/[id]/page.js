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

  if (loading) return <p style={{ padding: '20px', color: '#f8fafc', fontWeight: 700 }}>Loading note details...</p>

  if (errorMsg) return (
    <div style={{ padding: '20px' }}>
      <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '16px' }}>{errorMsg}</p>
      <Link href="/dashboard" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>Back to Dashboard</Link>
    </div>
  )

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', fontWeight: 900 }}>{note.title}</h1>
        <span style={{
          padding: '5px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 800,
          backgroundColor: note.status === 'ready' || note.status === 'summarized' ? '#064e3b' : '#78350f',
          color: note.status === 'ready' || note.status === 'summarized' ? '#34d399' : '#fbbf24',
          letterSpacing: '0.5px'
        }}>
          {note.status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleReprocess}
          disabled={reprocessing}
          style={{
            padding: '10px 18px',
            backgroundColor: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          {reprocessing ? '⏳ Reprocessing...' : '🔄 Re-run Summarizer & Quiz Generator'}
        </button>
        <Link
          href={`/quiz/${note.id}`}
          style={{
            padding: '10px 18px',
            backgroundColor: '#0d9488',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          Take Quiz &rarr;
        </Link>
      </div>

      {/* AI Summary Card */}
      <section style={{ marginTop: '30px', backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#93c5fd', margin: '0 0 12px 0', fontSize: '20px', fontWeight: 800 }}>✨ AI Key Takeaways Summary</h2>
        {summary ? (
          <p style={{ color: '#f0f9ff', fontSize: '16px', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
            {summary.summary_text}
          </p>
        ) : (
          <p style={{ color: '#93c5fd', margin: 0, fontWeight: 600 }}>
            Summary is being generated or hasn't been created yet. Click "Re-run Summarizer" above if needed.
          </p>
        )}
      </section>

      {/* Raw Extracted Text */}
      <section style={{ marginTop: '30px' }}>
        <h2 style={{ color: '#f8fafc', marginBottom: '12px', fontSize: '20px', fontWeight: 800 }}>Raw Extracted Text</h2>
        <div style={{
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '20px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          maxHeight: '350px',
          overflowY: 'auto'
        }}>
          {note.raw_text || 'No extracted text found. Ensure text extraction completed successfully.'}
        </div>
      </section>
    </div>
  )
}
