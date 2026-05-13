'use client'

import { useState, useRef } from 'react'
import styles from './TaskForm.module.css'

interface Props {
  onAdd: (title: string, description: string) => Promise<void>
}

export default function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAdd(title.trim(), description.trim())
      setTitle('')
      setDescription('')
      setShowDesc(false)
      titleRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="O que precisa ser feito?"
          className={styles.titleInput}
          maxLength={200}
          autoComplete="off"
          disabled={submitting}
        />
        <div className={styles.inputLine} />
      </div>

      {showDesc ? (
        <div className={styles.descGroup}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Adicione detalhes (opcional)"
            className={styles.descInput}
            rows={3}
            maxLength={1000}
            disabled={submitting}
          />
          <div className={styles.inputLine} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDesc(true)}
          className={styles.addDescBtn}
        >
          + descrição
        </button>
      )}

      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className={styles.submitBtn}
      >
        {submitting ? (
          <span className={styles.submitSpinner} />
        ) : (
          <>
            <span className={styles.submitIcon}>◆</span>
            Adicionar
          </>
        )}
      </button>
    </form>
  )
}
