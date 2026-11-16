import { useState } from 'react'
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'

export type SidebarItem = {
  key: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export type SidebarProps = {
  open?: boolean
  onClose?: () => void
  activeKey?: string
  onNavigate?: (key: string) => void
}

const primaryItems: SidebarItem[] = [
  { key: 'board', label: 'Моя доска', icon: <AppstoreOutlined /> },
  { key: 'today', label: 'Сегодня', icon: <CheckSquareOutlined />, badge: 4 },
  { key: 'calendar', label: 'Календарь', icon: <CalendarOutlined /> },
]

const workspaceItems: SidebarItem[] = [
  { key: 'projects', label: 'Проекты', icon: <FolderOpenOutlined /> },
  { key: 'team', label: 'Команда', icon: <TeamOutlined /> },
]

export function Sidebar({ open = false, onClose, activeKey = 'board', onNavigate }: SidebarProps) {
  const [isWorkspaceOpen, setWorkspaceOpen] = useState(true)

  const handleNavigate = (key: string) => {
    onNavigate?.(key)
    onClose?.()
  }

  return (
    <>
      <aside className={`app-sidebar${open ? ' app-sidebar--open' : ''}`} aria-label="Основная навигация">
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <span className="brand-name">flowdesk</span>
          <button className="icon-button sidebar-close" type="button" aria-label="Закрыть меню" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-label">Навигация</p>
          <ul className="sidebar-list">
            {primaryItems.map((item) => (
              <SidebarNavItem key={item.key} item={item} active={item.key === activeKey} onClick={handleNavigate} />
            ))}
          </ul>

          <div className="sidebar-section-head">
            <button className="sidebar-label-button" type="button" onClick={() => setWorkspaceOpen((value) => !value)}>
              Рабочее пространство
              <span className={`chevron${isWorkspaceOpen ? ' chevron--open' : ''}`}>⌄</span>
            </button>
            <button className="icon-button sidebar-add" type="button" aria-label="Добавить проект"><PlusOutlined /></button>
          </div>
          {isWorkspaceOpen && (
            <ul className="sidebar-list">
              {workspaceItems.map((item) => (
                <SidebarNavItem key={item.key} item={item} active={item.key === activeKey} onClick={handleNavigate} />
              ))}
            </ul>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-item" type="button" onClick={() => handleNavigate('settings')}>
            <SettingOutlined /><span>Настройки</span>
          </button>
          <div className="sidebar-profile">
            <div className="avatar avatar--small">АК</div>
            <div className="profile-copy"><strong>Алексей К.</strong><span>Личный аккаунт</span></div>
            <span className="profile-status" aria-label="В сети" />
          </div>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" type="button" aria-label="Закрыть меню" onClick={onClose} />}
    </>
  )
}

function SidebarNavItem({ item, active, onClick }: { item: SidebarItem; active: boolean; onClick: (key: string) => void }) {
  return (
    <li>
      <button className={`sidebar-item${active ? ' sidebar-item--active' : ''}`} type="button" onClick={() => onClick(item.key)} aria-current={active ? 'page' : undefined}>
        <span className="sidebar-item-icon">{item.icon}</span>
        <span>{item.label}</span>
        {item.badge !== undefined && <span className="sidebar-badge">{item.badge}</span>}
      </button>
    </li>
  )
}
