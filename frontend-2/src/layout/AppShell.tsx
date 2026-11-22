import { useState } from 'react'
import type { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export type AppShellProps = {
  children?: ReactNode
  title?: string
  activeKey?: string
  onNavigate?: (key: string) => void
  onCreateTask?: () => void
}

export function AppShell({ children, title, activeKey, onNavigate, onCreateTask }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} activeKey={activeKey} onNavigate={onNavigate} />
      <div className="app-main">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} onCreate={onCreateTask} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}

export { Header } from './Header'
export { Sidebar } from './Sidebar'
