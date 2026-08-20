'use client'
import { useState, useEffect } from 'react'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('study_buddy_todos')
      if (saved) {
        setTodos(JSON.parse(saved))
      } else {
        // Initial default tasks matching retro study theme
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
    if (!newTask.trim()) return
    const item = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false
    }
    saveTodos([...todos, item])
    setNewTask('')
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
        <span className="retro-window-title">TO-DO-LIST</span>
        <div className="retro-window-controls">
          <div className="retro-control-btn">—</div>
          <div className="retro-control-btn">□</div>
          <div className="retro-control-btn">✕</div>
        </div>
      </div>

      {/* Window Body */}
      <div className="retro-window-body" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>

        <div>
          {/* Task Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', fontWeight: 800 }}>
            <span>TASKS ({todos.length})</span>
            <span>{completedCount} / {todos.length} COMPLETED</span>
          </div>

          {/* New Task Input Line */}
          <form onSubmit={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #4a2c11', paddingBottom: '6px' }}>
            <span style={{ fontSize: '16px', opacity: 0.5 }}>:::</span>
            <span style={{ fontSize: '18px', cursor: 'pointer' }} onClick={handleAdd}>☐</span>
            <input
              type="text"
              placeholder="Task title..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                outline: 'none',
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: 800,
                fontSize: '15px',
                color: '#4a2c11'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: '11px',
                letterSpacing: '1px',
                color: '#4a2c11'
              }}
            >
              🕒 SET
            </button>
          </form>

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
            {todos.map(todo => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: '1px dashed #d6be9f',
                  paddingBottom: '8px'
                }}
              >
                <span style={{ fontSize: '14px', opacity: 0.4 }}>:::</span>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a2c11',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  flex: 1,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontWeight: 800,
                  fontSize: '14px',
                  color: todo.completed ? '#a88c74' : '#4a2c11',
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
                    opacity: 0.7
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
            onClick={handleAdd}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '2px solid #4a2c11',
              backgroundColor: '#4a2c11',
              color: '#faf6f0',
              fontSize: '20px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #24140a'
            }}
            title="Add Task"
          >
            +
          </button>
        </div>

      </div>
    </div>
  )
}
