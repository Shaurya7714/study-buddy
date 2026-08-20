'use client'
import { useState, useEffect, useRef } from 'react'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')
  const inputRef = useRef(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('study_buddy_todos')
      if (saved) {
        setTodos(JSON.parse(saved))
      } else {
        // Initial default tasks matching study theme
        setTodos([
          { id: 1, text: 'Review Data Structures Notes', completed: false },
          { id: 2, text: 'Complete 1 Pomodoro Session', completed: true },
          { id: 3, text: 'Take SM-2 Spaced Review Quiz', completed: false }
        ])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Save to localStorage when todos update
  const saveTodos = (updated) => {
    setTodos(updated)
    try {
      localStorage.setItem('study_buddy_todos', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAdd = (e) => {
    if (e) e.preventDefault()
    
    // If input has text, add the new task!
    if (newTask.trim()) {
      const item = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false
      }
      saveTodos([...todos, item])
      setNewTask('')
    } else {
      // If input is empty, focus the input field so user can type!
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleToggle = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    saveTodos(updated)
  }

  const handleDelete = (id) => {
    const updated = todos.filter(t => t.id !== id)
    saveTodos(updated)
  }

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="retro-window">
      {/* Window Header */}
      <div className="retro-window-header">
        <span className="retro-window-title">📋 TO-DO-LIST</span>
        <div className="retro-window-controls">
          <div className="retro-control-btn">—</div>
          <div className="retro-control-btn">□</div>
          <div className="retro-control-btn">✕</div>
        </div>
      </div>

      {/* Window Body */}
      <div className="retro-window-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        <div>
          {/* Task Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', fontWeight: 800 }}>
            <span style={{ color: '#818cf8', letterSpacing: '1px' }}>TASKS ({todos.length})</span>
            <span style={{ color: '#8b8fa3' }}>{completedCount} / {todos.length} COMPLETED</span>
          </div>

          {/* New Task Input Form */}
          <form onSubmit={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', backgroundColor: '#1a1a28', padding: '10px 14px', borderRadius: '12px', border: '1px solid #2a2a3e' }}>
            <span style={{ fontSize: '16px', color: '#6366f1' }}>✚</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type new task here..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                outline: 'none',
                fontWeight: 600,
                fontSize: '14px',
                color: '#f8fafc'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '12px',
                color: '#ffffff'
              }}
            >
              ADD TASK
            </button>
          </form>

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {todos.map(todo => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#161622',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #1e1e2e',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6366f1',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  flex: 1,
                  fontWeight: 600,
                  fontSize: '14px',
                  color: todo.completed ? '#64748b' : '#f8fafc',
                  textDecoration: todo.completed ? 'line-through' : 'none'
                }}>
                  {todo.text}
                </span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#8b8fa3',
                    transition: 'color 0.2s ease'
                  }}
                  title="Delete Task"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Add Task Button in bottom-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={handleAdd}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
            title="Add New Task"
          >
            +
          </button>
        </div>

      </div>
    </div>
  )
}
