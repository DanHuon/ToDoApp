'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Task } from '@/app/lib/types'
import { useAuth } from '@/app/lib/AuthContext'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import styles from './TodoApp.module.css'

type Filter = 'all' | 'active' | 'completed'

export default function TodoApp() {
  const router = useRouter()
  const { session, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Falha ao carregar tarefas')
      const data = await res.json()
      setTasks(data)
    } catch {
      setError('Não foi possível carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const addTask = async (title: string, description: string) => {
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      description: description || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTasks(prev => [optimisticTask, ...prev])

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setTasks(prev => prev.map(t => (t.id === optimisticTask.id ? created : t)))
    } catch {
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id))
      setError('Erro ao criar tarefa.')
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: newCompleted } : t)))

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch {
      setTasks(prev => prev.map(t => (t.id === id ? task : t)))
      setError('Erro ao atualizar tarefa.')
    }
  }

  const editTask = async (id: string, title: string, description: string) => {
    const original = tasks.find(t => t.id === id)
    if (!original) return
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, title, description: description || null } : t))
    )

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch {
      setTasks(prev => prev.map(t => (t.id === id ? original : t)))
      setError('Erro ao editar tarefa.')
    }
  }

  const deleteTask = async (id: string) => {
    const original = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      if (original) setTasks(prev => [original, ...prev])
      setError('Erro ao remover tarefa.')
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <span className={styles.logoMark}>◆</span>
            <span className={styles.logoText}>Tarefas</span>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.metaLabel}>
              {counts.active === 0 && counts.all > 0
                ? 'tudo feito'
                : `${counts.active} pendente${counts.active !== 1 ? 's' : ''}`}
            </span>
            <span className={styles.userInfo}>{session?.user.name}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Sair
            </button>
          </div>
        </div>
        <div className={styles.headerRule} />
      </header>

      <main className={styles.main}>
        {/* Left column: Form + Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <div className={styles.sidebarSection}>
              <h2 className={styles.sectionLabel}>Nova tarefa</h2>
              <TaskForm onAdd={addTask} />
            </div>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sectionLabel}>Filtrar</h2>
              <nav className={styles.filters}>
                {(['all', 'active', 'completed'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                  >
                    <span className={styles.filterLabel}>
                      {f === 'all' ? 'Todas' : f === 'active' ? 'Pendentes' : 'Concluídas'}
                    </span>
                    <span className={styles.filterCount}>{counts[f]}</span>
                  </button>
                ))}
              </nav>
            </div>

            {counts.completed > 0 && (
              <div className={styles.sidebarSection}>
                <button
                  className={styles.clearBtn}
                  onClick={async () => {
                    const completed = tasks.filter(t => t.completed)
                    for (const t of completed) await deleteTask(t.id)
                  }}
                >
                  Limpar concluídas
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right column: Task list */}
        <section className={styles.content}>
          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
              <p>Carregando tarefas…</p>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              filter={filter}
              onToggle={toggleTask}
              onEdit={editTask}
              onDelete={deleteTask}
            />
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerRule} />
        <div className={styles.footerInner}>
          <span>Tarefas — {new Date().getFullYear()}</span>
          <span>SQLite · Next.js · Prisma</span>
        </div>
      </footer>
    </div>
  )
}
