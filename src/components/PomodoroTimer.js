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
        <span className="retro-window-title">TIMER</span>
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
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#4a2c11'
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
            color: '#4a2c11',
            fontFamily: "'Courier New', Courier, monospace",
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
                padding: '10px 24px',
                borderRadius: '30px',
                border: '2px solid #4a2c11',
                backgroundColor: isRunning ? '#ebd8c3' : '#faf6f0',
                color: '#4a2c11',
                fontWeight: 900,
                fontSize: '15px',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px #4a2c11',
                transition: 'all 0.15s ease'
              }}
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>

            {/* RESET Icon Button */}
            <button
              onClick={handleReset}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '2px solid #4a2c11',
                backgroundColor: '#faf6f0',
                color: '#4a2c11',
                fontSize: '20px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '2px 2px 0px #4a2c11'
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
            padding: '16px',
            backgroundColor: '#e6d3be',
            border: '2px solid #4a2c11',
            borderRadius: '10px',
            maxWidth: '320px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '13px' }}>⚙ CUSTOM DURATIONS (MINUTES):</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Pomo:</label>
                <input
                  type="number"
                  value={durations.pomodoro / 60}
                  onChange={(e) => setDurations({ ...durations, pomodoro: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '60px', padding: '4px', border: '1.5px solid #4a2c11', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Short:</label>
                <input
                  type="number"
                  value={durations.short / 60}
                  onChange={(e) => setDurations({ ...durations, short: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '60px', padding: '4px', border: '1.5px solid #4a2c11', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Long:</label>
                <input
                  type="number"
                  value={durations.long / 60}
                  onChange={(e) => setDurations({ ...durations, long: Math.max(1, Number(e.target.value)) * 60 })}
                  style={{ width: '60px', padding: '4px', border: '1.5px solid #4a2c11', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}
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
