import type { Metadata } from 'next'
import './styles/globals.css'
import { AuthProvider } from '@/app/lib/AuthContext'

export const metadata: Metadata = {
  title: 'Tarefas — Todo',
  description: 'Gerencie suas tarefas com elegância.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
