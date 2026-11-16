import { BellOutlined, MenuOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'

export type HeaderProps = {
  title?: string
  onMenuClick?: () => void
  onCreate?: () => void
}

export function Header({ title = 'Моя доска', onMenuClick, onCreate }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-leading">
        <button className="icon-button menu-toggle" type="button" aria-label="Открыть меню" onClick={onMenuClick}><MenuOutlined /></button>
        <div className="header-title-wrap">
          <span className="header-kicker">Рабочее пространство</span>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="header-actions">
        <label className="search-box">
          <SearchOutlined />
          <input type="search" placeholder="Поиск" aria-label="Поиск" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification-button" type="button" aria-label="Уведомления"><BellOutlined /><span className="notification-dot" /></button>
        <button className="primary-button header-create" type="button" onClick={onCreate}><PlusOutlined /><span>Новая задача</span></button>
        <div className="avatar" aria-label="Профиль Алексея К. ">АК</div>
      </div>
    </header>
  )
}
