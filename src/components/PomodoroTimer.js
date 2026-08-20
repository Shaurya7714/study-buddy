'use client'
import { useState, useEffect } from 'react'

export default function PomodoroTimer() {
  const [mode, setMode] = useState('pomodoro') // 'pomodoro' | 'short' | 'long'
  const [durations, setDurations] = useState({
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  })
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Sync timeLeft when mode changes or durations update
  useEffect(() => {
    setTimeLeft(durations[mode])
    setIsRunning(false)
  }, [mode, durations])

  // Countdown timer effect
  useEffect(() => {
    let timer = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      playAlarm()
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 1.2)
    } catch (e) {
      console.log('Audio alert fallback')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(durations[mode])
  }

  return (
    <div className="retro-window">
      {/* Window Header */}
      <div className="retro-window-header">
        <span className="retro-window-title">⏱️ TIMER</span>
        <div className="retro-window-controls">
          <div className="retro-control-btn">—</div>
          <div className="retro-control-btn">□</div>
          <div className="retro-control-btn">✕</div>
        </div>
      </div>

      {/* Window Body */}
      <div className="retro-window-body" style={{ position: 'relative', textAlign: 'center', padding: '32px 24px 24px 24px' }}>
        {/* Settings Icon */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#8b8fa3',
            transition: 'color 0.2s ease'
          }}
          title="Timer Settings"
        >
          ⚙
        </button>

        {/* Display + Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '20px 0 30px 0', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#f8fafc',
            fontFamily: "'Inter', monospace",
            letterSpacing: '-2px',
            lineHeight: 1
          }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* START / PAUSE Pill Button */}
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                padding: '12px 28px',
                borderRadius: '30px',
                border: 'none',
                background: isRunning ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: isRunning ? '0 4px 20px rgba(245,158,11,0.3)' : '0 4px 20px rgba(99,102,241,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>

            {/* RESET Icon Button */}
            <button
              onClick={handleReset}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid #2a2a3e',
                backgroundColor: '#1a1a28',
                color: '#f8fafc',
                fontSize: '20px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Reset Timer"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Custom Durations Settings Modal overlay */}
        {showSettings && (
          <div style={{
            margin: '0 auto 20px auto',
            padding: '16px 20px',
            backgroundColor: '#1a1a28',
            border: '1px solid #2a2a3e',
            borderRadius: '12px',
            maxWidth: '340px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 800, fontSize: '12px', color: '#818cf8', letterSpacing: '1px' }}>⚙ CUSTOM DURATIONS (MINUTES)</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8b8fa3', display: 'block', marginBottom: '4px' }}>Pomo:</label>
                <input
                  type="number"
                  value={durations.pomodoro / 60}
                  onChange={(e) => setDurations({ ...durations, pomodoro: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '65px', padding: '6px', backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', textAlign: 'center', fontWeight: 700, color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8b8fa3', display: 'block', marginBottom: '4px' }}>Short:</label>
                <input
                  type="number"
                  value={durations.short / 60}
                  onChange={(e) => setDurations({ ...durations, short: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '65px', padding: '6px', backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', textAlign: 'center', fontWeight: 700, color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8b8fa3', display: 'block', marginBottom: '4px' }}>Long:</label>
                <input
                  type="number"
                  value={durations.long / 60}
                  onChange={(e) => setDurations({ ...durations, long: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '65px', padding: '6px', backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '6px', textAlign: 'center', fontWeight: 700, color: '#f8fafc' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="retro-tabs">
        <button
          className={`retro-tab ${mode === 'pomodoro' ? 'active' : ''}`}
          onClick={() => setMode('pomodoro')}
        >
          POMODORO
        </button>
        <button
          className={`retro-tab ${mode === 'short' ? 'active' : ''}`}
          onClick={() => setMode('short')}
        >
          SHORT BREAK
        </button>
        <button
          className={`retro-tab ${mode === 'long' ? 'active' : ''}`}
          onClick={() => setMode('long')}
        >
          LONG BREAK
        </button>
      </div>
    </div>
  )
}
