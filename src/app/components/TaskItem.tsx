'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/app/lib/types'
import styles from './TaskItem.module.css'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, description: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description || '')
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editing])

  const handleEdit = () => {
    if (task.completed) return
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditing(true)
  }

  const handleSave = () => {
    if (!editTitle.trim()) return
    onEdit(task.id, editTitle.trim(), editDesc.trim())
    setEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short',
  }).format(new Date(task.createdAt))

  if (editing) {
    return (
      <div className={styles.editWrapper}>
        <input
          ref={titleInputRef}
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editTitle}
          maxLength={200}
        />
        <div className={styles.editLine} />
        <textarea
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editDesc}
          placeholder="Descrição (opcional)"
          rows={2}
          maxLength={1000}
        />
        <div className={styles.editActions}>
          <button onClick={handleSave} className={styles.saveBtn} disabled={!editTitle.trim()}>
            Salvar
          </button>
          <button onClick={handleCancel} className={styles.cancelBtn}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.wrapper} ${task.completed ? styles.wrapperCompleted : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      {/* Left: checkbox + index line */}
      <button
        onClick={() => onToggle(task.id)}
        className={`${styles.checkBtn} ${task.completed ? styles.checkBtnDone : ''}`}
        aria-label={task.completed ? 'Desmarcar' : 'Concluir'}
      >
        {task.completed ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : null}
      </button>

      {/* Content */}
      <div className={styles.content} onClick={!task.completed ? handleEdit : undefined}>
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${task.completed ? styles.titleDone : ''}`}>
            {task.title}
          </span>
          {task.completed && (
            <span className={styles.doneTag}>concluída</span>
          )}
        </div>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}
        <span className={styles.date}>{formattedDate}</span>
      </div>

      {/* Actions */}
      <div className={`${styles.actions} ${hovered ? styles.actionsVisible : ''}`}>
        {!task.completed && (
          <button
            onClick={handleEdit}
            className={styles.actionBtn}
            title="Editar"
          >
            <EditIcon />
          </button>
        )}
        {confirmDelete ? (
          <button
            onClick={() => onDelete(task.id)}
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            title="Confirmar remoção"
          >
            ✕
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className={styles.actionBtn}
            title="Remover"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <div className={styles.divider} />
    </div>
  )
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9.5 1.5L11.5 3.5L4.5 10.5H2.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 4H11M9.5 4V10.5C9.5 11 9 11.5 8.5 11.5H4.5C4 11.5 3.5 11 3.5 10.5V4M5 4V3C5 2.5 5.5 2 6 2H7C7.5 2 8 2.5 8 3V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
