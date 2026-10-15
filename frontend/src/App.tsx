import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import './App.css'

interface Todo {
  id: number
  title: string
  description: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

type Filter = 'all' | 'active' | 'done'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const RING_RADIUS = 26
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    request<Todo[]>('/todos')
      .then(setTodos)
      .catch((e: Error) =>
        setError(`Can't reach the API at ${API}. Is the backend running? (${e.message})`),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus()
  }, [editingId])

  const doneCount = todos.filter((t) => t.completed).length
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0

  const visible = useMemo(
    () =>
      todos.filter((t) =>
        filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed,
      ),
    [todos, filter],
  )

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong')

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    setError('')
    try {
      const created = await request<Todo>('/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      setTodos((prev) => [...prev, created])
    } catch (err) {
      setDraft(title)
      fail(err)
    }
  }

  async function toggle(todo: Todo) {
    const previous = todos
    setError('')
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)))
    try {
      await request<Todo>(`/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
      })
    } catch (err) {
      setTodos(previous)
      fail(err)
    }
  }

  async function remove(id: number) {
    const previous = todos
    setError('')
    setTodos((prev) => prev.filter((t) => t.id !== id))
    try {
      await request<void>(`/todos/${id}`, { method: 'DELETE' })
    } catch (err) {
      setTodos(previous)
      fail(err)
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id)
    setEditText(todo.title)
  }

  async function saveEdit(todo: Todo) {
    const title = editText.trim()
    setEditingId(null)
    if (!title || title === todo.title) return
    const previous = todos
    setError('')
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, title } : t)))
    try {
      await request<Todo>(`/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
    } catch (err) {
      setTodos(previous)
      fail(err)
    }
  }

  function onEditKey(e: KeyboardEvent<HTMLInputElement>, todo: Todo) {
    if (e.key === 'Enter') void saveEdit(todo)
    if (e.key === 'Escape') setEditingId(null)
  }

  async function clearDone() {
    const previous = todos
    const doneIds = todos.filter((t) => t.completed).map((t) => t.id)
    setError('')
    setTodos((prev) => prev.filter((t) => !t.completed))
    try {
      await Promise.all(doneIds.map((id) => request<void>(`/todos/${id}`, { method: 'DELETE' })))
    } catch (err) {
      setTodos(previous)
      fail(err)
    }
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <div className="blob blob-a" />
      <div className="blob blob-b" />

      <main className="card">
        <header className="header">
          <div>
            <p className="date">{today}</p>
            <h1>My Tasks</h1>
            <p className="subtitle">
              {todos.length === 0
                ? 'Nothing here yet'
                : `${doneCount} of ${todos.length} completed`}
            </p>
          </div>

          <div className="ring" aria-label={`${percent}% complete`}>
            <svg viewBox="0 0 64 64">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="32" cy="32" r={RING_RADIUS} />
              <circle
                className="ring-fg"
                cx="32"
                cy="32"
                r={RING_RADIUS}
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
              />
            </svg>
            <span>{percent}%</span>
          </div>
        </header>

        <form className="add" onSubmit={addTodo}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New task"
            maxLength={120}
          />
          <button type="submit" disabled={!draft.trim()}>
            Add
          </button>
        </form>

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <nav className="filters">
          {(['all', 'active', 'done'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="empty">
            {filter === 'done'
              ? 'No completed tasks yet'
              : filter === 'active'
                ? 'All caught up 🎉'
                : 'Add your first task above ✨'}
          </p>
        ) : (
          <ul className="list">
            {visible.map((todo) => (
              <li key={todo.id} className={todo.completed ? 'item done' : 'item'}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => void toggle(todo)}
                    aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'done'}`}
                  />
                  <span className="box">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </label>

                {editingId === todo.id ? (
                  <input
                    ref={editRef}
                    className="edit"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => void saveEdit(todo)}
                    onKeyDown={(e) => onEditKey(e, todo)}
                    maxLength={120}
                  />
                ) : (
                  <span
                    className="title"
                    onDoubleClick={() => startEdit(todo)}
                    title="Double-click to edit"
                  >
                    {todo.title}
                  </span>
                )}

                <button
                  type="button"
                  className="delete"
                  onClick={() => void remove(todo.id)}
                  aria-label={`Delete "${todo.title}"`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="footer">
          <span>{todos.length - doneCount} left</span>
          <button type="button" onClick={() => void clearDone()} disabled={doneCount === 0}>
            Clear completed
          </button>
        </footer>
      </main>
    </>
  )
}

export default App