'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag } from '@/app/lib/types'
import { formatDate } from '@/app/lib/formatDate'
import styles from './TaskItem.module.css'

interface Props {
  tag: Tag
  onEdit: (id: string, name: string, description: string) => void
  onDelete: (id: string) => void
}

export default function TagItem({ tag, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(tag.name)
  const [editDesc, setEditDesc] = useState(tag.description || '')
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editing])

  const handleEdit = () => {
    setEditName(tag.name)
    setEditDesc(tag.description || '')
    setEditing(true)
  }

  const handleSave = () => {
    if (!editName.trim()) return
    onEdit(tag.id, editName.trim(), editDesc.trim())
    setEditing(false)
  }

  const handleCancel = () => {
    setEditName(tag.name)
    setEditDesc(tag.description || '')
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <div className={styles.editWrapper}>
        <input
          ref={nameInputRef}
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editTitle}
          maxLength={30}
        />
        <div className={styles.editLine} />
        <textarea
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editDesc}
          placeholder="Descrição (opcional)"
          rows={2}
          maxLength={300}
        />
        <div className={styles.editActions}>
          <button onClick={handleSave} className={styles.saveBtn} disabled={!editName.trim()}>
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
      className={styles.wrapper}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      <div style={{ width: '18px', display: 'flex', justifyContent: 'center', marginTop: '3px', color: 'var(--ink-faint)', fontSize: '14px' }}>
        #
      </div>
      <div className={styles.content} onClick={handleEdit}>
        <div className={styles.titleRow}>
          <span className={styles.title} style={{ background: '#e5e7eb', color: '#374151', padding: '4px 10px', borderRadius: '12px' }}>
            {tag.name}
          </span>
        </div>
        {tag.description && (
          <p className={styles.description}>{tag.description}</p>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <span className={styles.date}>CRIADO EM: {formatDate(tag.createdAt, 'display')}</span>
        </div>
      </div>

      <div className={`${styles.actions} ${hovered ? styles.actionsVisible : ''}`}>
        <button
          onClick={handleEdit}
          className={styles.actionBtn}
          title="Editar"
        >
          <EditIcon />
        </button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(tag.id)}
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
