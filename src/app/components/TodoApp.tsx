'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Task, Tag } from '@/app/lib/types'
import { useAuth } from '@/app/lib/AuthContext'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import TagForm from './TagForm'
import TagList from './TagList'
import KanbanTemporal from './KanbanTemporal'
import KanbanCategorico from './KanbanCategorico'
import styles from './TodoApp.module.css'

type Filter = 'all' | 'active' | 'completed'
type ViewMode = 'tasks' | 'tags' | 'kanban-temporal' | 'kanban-categorico'

export default function TodoApp() {
  const router = useRouter()
  const { session, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('tasks')
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoTagEnabled, setAutoTagEnabled] = useState(false)
  const [toast, setToast] = useState<{ message: string; onUndo: () => void } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('auto-tag-new-tasks')
    if (saved !== null) {
      setAutoTagEnabled(saved === 'true')
    }
  }, [])

  const handleAutoTagToggle = (checked: boolean) => {
    setAutoTagEnabled(checked)
    localStorage.setItem('auto-tag-new-tasks', String(checked))
  }

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        setTags(data)
      }
    } catch {}
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Falha ao carregar tarefas')
      const data = await res.json()
      setTasks(data)
    } catch {
      setError('Nao foi possivel carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchTags()])
  }, [fetchTasks, fetchTags])

  useEffect(() => {
    fetchTasks()
    fetchTags()
  }, [fetchTasks, fetchTags])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const addTag = async (name: string, description: string) => {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setTags(prev => [created, ...prev])
    } catch {
      setError('Erro ao criar tag.')
    }
  }

  const editTag = async (id: string, name: string, description: string) => {
    const original = tags.find(t => t.id === id)
    if (!original) return
    setTags(prev => prev.map(t => (t.id === id ? { ...t, name, description } : t)))
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTags(prev => prev.map(t => (t.id === id ? updated : t)))
      fetchTasks()
    } catch {
      setTags(prev => prev.map(t => (t.id === id ? original : t)))
      setError('Erro ao editar tag.')
    }
  }

  const deleteTag = async (id: string) => {
    const original = tags.find(t => t.id === id)
    setTags(prev => prev.filter(t => t.id !== id))
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchTasks()
    } catch {
      if (original) setTags(prev => [original, ...prev])
      setError('Erro ao remover tag.')
    }
  }

  const addTask = async (title: string, description: string, dueDate?: string) => {
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      description: description || null,
      completed: false,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTasks(prev => [optimisticTask, ...prev])

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate: dueDate || null }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()

      if (autoTagEnabled) {
        try {
          const autoTagRes = await fetch(`/api/tasks/${created.id}/auto-tag`, {
            method: 'POST',
          })
          const autoTagData = await autoTagRes.json()
          if (autoTagRes.ok && autoTagData.success && autoTagData.task) {
            setTasks(prev => prev.map(t => (t.id === optimisticTask.id ? autoTagData.task : t)))
            fetchTags()
            return
          }
        } catch (e) {
          console.error('Error auto-tagging on task creation:', e)
        }
      }

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

  const editTask = async (id: string, title: string, description: string, dueDate?: string) => {
    const original = tasks.find(t => t.id === id)
    if (!original) return
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, title, description: description || null, dueDate: dueDate || null } : t))
    )

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate: dueDate || null }),
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

  const handleMoveTask = async (taskId: string, targetColumn: 'scheduled' | 'backlog' | 'completed') => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const originalCompleted = task.completed
    const originalDueDate = task.dueDate

    let completed = originalCompleted
    let dueDate = originalDueDate

    if (targetColumn === 'completed') {
      completed = true
    } else if (targetColumn === 'backlog') {
      completed = false
      dueDate = null
    } else if (targetColumn === 'scheduled') {
      completed = false
    }

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed, dueDate } : t))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, dueDate })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t))

      if (targetColumn === 'backlog' && originalDueDate !== null) {
        setToast({
          message: `Prazo da tarefa "${task.title}" removido`,
          onUndo: async () => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: originalCompleted, dueDate: originalDueDate } : t))
            try {
              const undoRes = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: originalCompleted, dueDate: originalDueDate })
              })
              if (undoRes.ok) {
                const undoData = await undoRes.json()
                setTasks(prev => prev.map(t => t.id === taskId ? undoData : t))
                fetchTags()
              }
            } catch {
              setError('Erro ao desfazer alteração.')
            }
            setToast(null)
          }
        })
        setTimeout(() => {
          setToast(prev => prev?.message.includes(`"${task.title}"`) ? null : prev)
        }, 5000)
      }
      fetchTags()
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: originalCompleted, dueDate: originalDueDate } : t))
      setError('Erro ao mover tarefa.')
    }
  }

  const handleUpdateDueDate = async (taskId: string, newDueDate: string | null) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const originalDueDate = task.dueDate
    const originalCompleted = task.completed
    const isoDate = newDueDate ? new Date(newDueDate).toISOString() : null

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: isoDate, completed: false } : t))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: isoDate, completed: false })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
      fetchTags()
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: originalDueDate, completed: originalCompleted } : t))
      setError('Erro ao atualizar prazo da tarefa.')
    }
  }

  const handleCategoricalAddTag = async (taskId: string, tagId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentTagIds = task.tags?.map(t => t.id) || []
    if (currentTagIds.includes(tagId)) return

    const newTagIds = [...currentTagIds, tagId]

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const addedTag = tags.find(tag => tag.id === tagId)
        return {
          ...t,
          tags: addedTag ? [...(t.tags || []), addedTag] : (t.tags || [])
        }
      }
      return t
    }))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: newTagIds })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)))
      fetchTags()
    } catch {
      setTasks(prev => prev.map(t => (t.id === taskId ? task : t)))
      setError('Erro ao vincular tag à tarefa.')
    }
  }

  const handleCategoricalRemoveTag = async (taskId: string, tagId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentTagIds = task.tags?.map(t => t.id) || []
    const newTagIds = currentTagIds.filter(id => id !== tagId)

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          tags: (t.tags || []).filter(tag => tag.id !== tagId)
        }
      }
      return t
    }))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: newTagIds })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)))
      fetchTags()
    } catch {
      setTasks(prev => prev.map(t => (t.id === taskId ? task : t)))
      setError('Erro ao remover tag da tarefa.')
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <span className={styles.logoMark}>@</span>
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
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <div className={styles.sidebarSection}>
              <h2 className={styles.sectionLabel}>Visualizações</h2>
              <nav className={styles.filters}>
                <button
                  onClick={() => setViewMode('tasks')}
                  className={`${styles.filterBtn} ${viewMode === 'tasks' ? styles.filterBtnActive : ''}`}
                >
                  <span className={styles.filterLabel}>Lista de Tarefas</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban-temporal')}
                  className={`${styles.filterBtn} ${viewMode === 'kanban-temporal' ? styles.filterBtnActive : ''}`}
                >
                  <span className={styles.filterLabel}>Kanban Prazos</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban-categorico')}
                  className={`${styles.filterBtn} ${viewMode === 'kanban-categorico' ? styles.filterBtnActive : ''}`}
                >
                  <span className={styles.filterLabel}>Kanban Tags</span>
                </button>
                <button
                  onClick={() => setViewMode('tags')}
                  className={`${styles.filterBtn} ${viewMode === 'tags' ? styles.filterBtnActive : ''}`}
                >
                  <span className={styles.filterLabel}>Gerenciar Tags</span>
                </button>
              </nav>
            </div>

            {viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Nova Tarefa</h2>
                <TaskForm onAdd={addTask} />
              </div>
            )}

            {viewMode === 'tags' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Nova Tag</h2>
                <TagForm onAdd={addTag} />
              </div>
            )}

            {viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Filtrar Tarefas</h2>
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
                      <span className={styles.filterCount}>{counts[f] || 0}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {viewMode === 'tasks' && (
              <div className={styles.sidebarSection}>
                <h2 className={styles.sectionLabel}>Preferências</h2>
                <label className={styles.autoTagToggle}>
                  <input
                    type="checkbox"
                    className={styles.autoTagCheckbox}
                    checked={autoTagEnabled}
                    onChange={(e) => handleAutoTagToggle(e.target.checked)}
                  />
                  <span className={styles.autoTagLabel}>Vincular tags automaticamente (IA)</span>
                </label>
              </div>
            )}

            {counts.completed > 0 && viewMode === 'tasks' && (
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

        <section className={styles.content}>
          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
              <button onClick={() => setError(null)}>X</button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
              <p>Carregando...</p>
            </div>
          ) : viewMode === 'tags' ? (
            <TagList tags={tags} onEdit={editTag} onDelete={deleteTag} />
          ) : viewMode === 'kanban-temporal' ? (
            <KanbanTemporal
              tasks={tasks}
              onMoveTask={handleMoveTask}
              onUpdateDueDate={handleUpdateDueDate}
            />
          ) : viewMode === 'kanban-categorico' ? (
            <KanbanCategorico
              tasks={tasks}
              tags={tags}
              onAddTagToTask={handleCategoricalAddTag}
              onRemoveTagFromTask={handleCategoricalRemoveTag}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              filter={filter}
              tags={tags}
              onToggle={toggleTask}
              onEdit={editTask}
              onDelete={deleteTask}
              onRefresh={refreshData}
            />
          )}
        </section>
      </main>

      {toast && (
        <div className={styles.toastContainer}>
          <span>{toast.message}</span>
          <button onClick={toast.onUndo} className={styles.toastUndoBtn}>Desfazer</button>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerRule} />
        <div className={styles.footerInner}>
          <span>Tarefas - {new Date().getFullYear()}</span>
          <span>SQLite | Next.js | Prisma</span>
        </div>
      </footer>
    </div>
  )
}
