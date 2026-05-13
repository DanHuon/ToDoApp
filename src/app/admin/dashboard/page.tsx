'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './AdminDashboard.module.css'

interface User {
  id: string
  email: string
  name: string
  role: string
  _count?: {
    tasks: number
  }
}

interface TaskStats {
  total: number
  completed: number
  pending: number
}

interface DashboardStats {
  totalUsers: number
  totalTasks: number
  completionRate: number
  activeToday: number
}

export default function AdminDashboard() {
  const { session, logout, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTasks: 0,
    completionRate: 0,
    activeToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (!isAdmin) {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [session, isAdmin, router])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <span className={styles.logoMark}>●</span>
            <h1 className={styles.logoText}>ToDo Admin</h1>
          </div>
          <div className={styles.userSection}>
            <span className={styles.userRole}>ADM</span>
            <div className={styles.userMenu}>
              <span className={styles.userName}>{session?.user.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Sair
              </button>
            </div>
          </div>
        </div>
        <div className={styles.headerRule} />
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <div className={styles.navSection}>
              <p className={styles.navLabel}>Dashboard</p>
              <a href="#stats" className={styles.navLink}>
                Estatísticas
              </a>
              <a href="#users" className={styles.navLink}>
                Usuários
              </a>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <section className={styles.content}>
          {/* Stats Grid */}
          <div className={styles.statsGrid} id="stats">
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Usuários</p>
                <p className={styles.statValue}>{stats.totalUsers}</p>
              </div>
              <div className={styles.statAccent} />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✓</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Tarefas</p>
                <p className={styles.statValue}>{stats.totalTasks}</p>
              </div>
              <div className={styles.statAccent} />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Taxa de conclusão</p>
                <p className={styles.statValue}>
                  {stats.completionRate.toFixed(1)}%
                </p>
              </div>
              <div className={styles.statAccent} />
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Ativos hoje</p>
                <p className={styles.statValue}>{stats.activeToday}</p>
              </div>
              <div className={styles.statAccent} />
            </div>
          </div>

          {/* Users Section */}
          <section className={styles.usersSection} id="users">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Usuários do sistema</h2>
              <p className={styles.sectionSubtitle}>
                Total de {stats.totalUsers} usuários registrados
              </p>
            </div>

            <div className={styles.usersTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCol} style={{ flex: 2 }}>
                  Nome
                </div>
                <div className={styles.tableCol} style={{ flex: 2 }}>
                  Email
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Cargo
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Tarefas
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Ações
                </div>
              </div>

              <div className={styles.tableBody}>
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className={styles.tableRow}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={styles.tableCol} style={{ flex: 2 }}>
                      <span className={styles.userName}>{user.name}</span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 2 }}>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <span
                        className={`${styles.badge} ${
                          user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <span className={styles.taskCount}>
                        {user._count?.tasks || 0}
                      </span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className={styles.viewBtn}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className={styles.modal} onClick={() => setSelectedUser(null)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detalhes do usuário</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nome:</span>
                <span className={styles.detailValue}>{selectedUser.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{selectedUser.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Cargo:</span>
                <span className={styles.detailValue}>{selectedUser.role}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tarefas:</span>
                <span className={styles.detailValue}>
                  {selectedUser._count?.tasks || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
