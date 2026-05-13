'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/AuthContext'
import styles from './LoginPage.module.css'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        await register(formData.email, formData.password, formData.name)
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      {/* Decorative background elements */}
      <div className={styles.decorBg1} />
      <div className={styles.decorBg2} />

      <div className={styles.container}>
        {/* Header section */}
        <div className={styles.headerSection}>
          <div className={styles.logo}>
            <span className={styles.logoDot}>●</span>
            <span className={styles.logoText}>ToDo</span>
          </div>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Faça login para acessar suas tarefas'
              : 'Registre-se e comece a organizar suas tarefas'}
          </p>
        </div>

        {/* Form section */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠</span>
              <p>{error}</p>
            </div>
          )}

          {mode === 'register' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="name" className={styles.label}>
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                required={mode === 'register'}
                className={styles.input}
              />
              <div className={styles.fieldRule} />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              className={styles.input}
            />
            <div className={styles.fieldRule} />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className={styles.input}
            />
            <div className={styles.fieldRule} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              mode === 'login' ? 'Fazer login' : 'Criar conta'
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className={styles.toggleSection}>
          <p className={styles.toggleText}>
            {mode === 'login'
              ? 'Não tem conta? '
              : 'Já tem conta? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
                setFormData({ email: '', password: '', name: '' })
              }}
              className={styles.toggleButton}
            >
              {mode === 'login' ? 'Registre-se' : 'Faça login'}
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}
