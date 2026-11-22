import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Layout, message, Spin, Tag } from "antd";
import {
  AppstoreOutlined,
  InboxOutlined,
  PlusOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { api } from "./api";
import { STATUS_COLUMNS, type Task, type TaskStatus } from "./types";
import { KanbanColumn } from "./components/KanbanColumn";
import { TaskCard } from "./components/TaskCard";
import { TaskModal, type TaskFormValues } from "./components/TaskModal";
import { useTaskPreferences } from "./hooks/useTaskPreferences";
import "./index.css";

const CARD_PREFIX = import.meta.env.VITE_CARD_PREFIX || "CARD-";
const { Header, Content } = Layout;
const ENV_CARD_COLORS = {
  created: import.meta.env.CREATED_CARD_COLOR || "#5F76FC",
  backlog: import.meta.env.BACKLOG_CARD_COLOR || "#BDBF4F",
  archived: import.meta.env.ARCHIVED_CARD_COLOR || "#000000",
};
type Tab = "board" | "backlog" | "archive" | "settings";

const NAV_ITEMS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: "board", label: "Доска", icon: <AppstoreOutlined /> },
  { key: "backlog", label: "Бэклог", icon: <UnorderedListOutlined /> },
  { key: "archive", label: "Архив", icon: <InboxOutlined /> },
  { key: "settings", label: "Настройки", icon: <SettingOutlined /> },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [archived, setArchived] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("board");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { preferences: settings, setPreferences: setSettings } = useTaskPreferences();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [board, backlogTasks, archive] = await Promise.all([
        api.list(),
        api.backlog(),
        api.archived(),
      ]);
      setTasks(board);
      setBacklog(backlogTasks);
      setArchived(archive);
    } catch {
      message.error("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeTask = [...tasks, ...backlog, ...archived].find((task) => task.id === activeId) ?? null;
  const colorForStatus = (status: TaskStatus, current: string) =>
    status === "ASSIGNED" ? ENV_CARD_COLORS.created
      : status === "BACKLOG" ? ENV_CARD_COLORS.backlog
        : status === "ARCHIVED" ? ENV_CARD_COLORS.archived : current;
  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setModalOpen(true); };

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(Number(active.id));
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const task = tasks.find((item) => item.id === Number(active.id));
    if (!task) return;
    const targetTask = tasks.find((item) => item.id === Number(over.id));
    const targetStatus = (targetTask?.status ?? over.id) as TaskStatus;
    if (!STATUS_COLUMNS.some((column) => column.key === targetStatus)) return;
    const targetColumn = tasks.filter((item) => item.status === targetStatus && item.id !== task.id).sort((a, b) => a.order - b.order);
    const order = targetTask ? Math.max(0, targetColumn.findIndex((item) => item.id === targetTask.id)) : targetColumn.length;
    const previous = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: targetStatus, color: colorForStatus(targetStatus, item.color), order } : item));
    try {
      await api.move(task.id, targetStatus, order, colorForStatus(targetStatus, task.color));
      await load();
    } catch {
      setTasks(previous);
      message.error("Не удалось переместить задачу");
    }
  };
  const submit = async (values: TaskFormValues) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        createdAt: values.createdAt.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };
      if (editingTask) await api.update(editingTask.id, payload);
      else await api.create(payload);
      setModalOpen(false);
      await load();
      message.success(editingTask ? "Задача обновлена" : "Задача добавлена");
    } catch {
      message.error("Не удалось сохранить задачу");
    } finally { setSaving(false); }
  };
  const remove = async (task: Task) => {
    setSaving(true);
    try {
      await api.remove(task.id);
      setModalOpen(false);
      await load();
      message.success("Задача удалена");
    } catch { message.error("Не удалось удалить задачу"); }
    finally { setSaving(false); }
  };
  const archiveTask = async (task: Task) => {
    try { await api.archive(task.id); await load(); message.success("Задача отправлена в архив"); }
    catch { message.error("Не удалось архивировать задачу"); }
  };
  const restore = async (task: Task) => {
    try { await api.restore(task.id); await load(); message.success("Задача восстановлена"); }
    catch { message.error("Не удалось восстановить задачу"); }
  };
  const renderCards = (items: Task[], action?: "restore") => items.length ? items.map((task) => (
    <TaskCard key={task.id} task={task} assignedColor={ENV_CARD_COLORS.created} archivedColor={ENV_CARD_COLORS.archived}
      overdueColor={settings.overdueColor} cardPrefix={CARD_PREFIX} onOpen={openEdit}
      onRestore={action === "restore" ? restore : undefined} sortable={false} />
  )) : <Empty description="Задач пока нет" />;

  const pageTitle = tab === "board" ? "Доска" : tab === "backlog" ? "Бэклог" : tab === "archive" ? "Архив" : "Настройки";
  const pageDescription = tab === "board" ? "Планируйте работу и отслеживайте движение задач" : tab === "backlog" ? "Задачи, ожидающие назначения" : tab === "archive" ? "Завершённые и сохранённые задачи" : "Параметры рабочего пространства";
  const selectTab = (next: Tab) => { setTab(next); setMobileNavOpen(false); };
  const stats = (
    <section className="stats-row" aria-label="Сводка задач">
      <div><span>Всего задач</span><strong>{tasks.length}</strong></div>
      <div><span>В работе</span><strong>{tasks.filter((task) => task.status === "IN_PROGRESS").length}</strong></div>
      <div><span>Завершено</span><strong>{tasks.filter((task) => task.status === "DONE").length}</strong></div>
    </section>
  );
  const settingsPage = (
    <>
      {stats}
      <section className="settings-page">
        <div className="column-header"><h2 className="column-title">Конфигурация доски</h2></div>
        <div className="settings-card">
          <label htmlFor="default-due-days">Контрольный срок по умолчанию, дней
            <input id="default-due-days" type="number" min="1" max="365" value={settings.dueDays}
              onChange={(event) => setSettings((current) => ({ ...current, dueDays: Number(event.target.value) || 1 }))} />
          </label>
          <label htmlFor="overdue-card-color">Цвет карточки при истечении дедлайна
            <input id="overdue-card-color" type="color" value={settings.overdueColor}
              onChange={(event) => setSettings((current) => ({ ...current, overdueColor: event.target.value }))} />
          </label>
        </div>
      </section>
    </>
  );

  return (
    <Layout className="jira-app">
      <header className="jira-topbar">
        <button className="mobile-menu-button" type="button" aria-label="Открыть навигацию" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><MenuOutlined /></button>
        <a className="jira-brand" href="#board" onClick={(event) => { event.preventDefault(); selectTab("board"); }} aria-label="My desk — на доску">
          <span className="jira-brand-mark" aria-hidden="true">M</span><span>my desk</span>
        </a>
        <nav className={`jira-global-nav${mobileNavOpen ? " is-open" : ""}`} aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => <button key={item.key} type="button" className={`jira-nav-item${tab === item.key ? " is-active" : ""}`} aria-current={tab === item.key ? "page" : undefined} onClick={() => selectTab(item.key)}>{item.label}</button>)}
        </nav>
        <div className="jira-topbar-spacer" />
        <span className="jira-user-avatar" aria-label="Профиль пользователя">М</span>
      </header>

      <Layout className="jira-body">
        <aside className={`project-sidebar${mobileNavOpen ? " is-open" : ""}`} aria-label="Навигация проекта">
          <div className="project-name">Личный проект</div>
          <nav className="project-nav" aria-label="Разделы проекта">
            {NAV_ITEMS.map((item) => <button key={item.key} type="button" className={`project-nav-item${tab === item.key ? " is-active" : ""}`} aria-current={tab === item.key ? "page" : undefined} onClick={() => selectTab(item.key)}><span className="project-nav-icon">{item.icon}</span><span>{item.label}</span>{item.key === "archive" && archived.length ? <span className="project-nav-count">{archived.length}</span> : null}</button>)}
          </nav>
          <div className="sidebar-footer"><span className="connection-dot" /> Все изменения синхронизированы</div>
        </aside>
        {mobileNavOpen ? <button className="sidebar-backdrop" aria-label="Закрыть навигацию" onClick={() => setMobileNavOpen(false)} /> : null}

        <Content className="jira-content">
          <section className="page-heading">
            <div><h1 className="page-title-with-icon">{tab === "board" ? <AppstoreOutlined /> : tab === "backlog" ? <UnorderedListOutlined /> : tab === "archive" ? <InboxOutlined /> : <SettingOutlined />}<span>{pageTitle}</span></h1><p>{pageDescription}</p></div>
            <div className="page-heading-actions">
              {tab !== "settings" ? <Button className="view-settings-button" icon={<SettingOutlined />} onClick={() => selectTab("settings")}>Настройки доски</Button> : null}
              {tab !== "settings" ? <Button className="page-create-button" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Создать задачу</Button> : null}
            </div>
          </section>

          {tab === "settings" ? settingsPage : tab === "board" ? (
            <>
              {stats}
              <Spin spinning={loading}>
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
                  <div className="board">
                    {STATUS_COLUMNS.map((column) => <KanbanColumn key={column.key} status={column.key} title={column.title} accent={column.accent}
                      tasks={tasks.filter((task) => task.status === column.key).sort((a, b) => a.order - b.order)} onOpen={openEdit} onArchive={archiveTask} onAdd={openCreate} />)}
                  </div>
                  <DragOverlay>{activeTask ? <TaskCard task={activeTask} overdueColor={settings.overdueColor} onOpen={() => undefined} overlay /> : null}</DragOverlay>
                </DndContext>
              </Spin>
            </>
          ) : tab === "backlog" ? (
            <>{stats}<Spin spinning={loading}><section className="collection-panel"><div className="column-header"><h2 className="column-title">Не назначенные задачи <Tag>{backlog.length}</Tag></h2></div><div className="collection-cards">{backlog.length ? renderCards(backlog) : <div className="collection-empty" role="status"><span className="empty-column-icon" aria-hidden="true">✦</span><strong>Здесь пока пусто</strong><span>Добавьте новую задачу, чтобы начать работу</span></div>}</div></section></Spin></>
          ) : (
            <>{stats}<Spin spinning={loading}><section className="collection-panel"><div className="column-header"><h2 className="column-title">Архивные задачи <Tag>{archived.length}</Tag></h2></div><div className="collection-cards">{archived.length ? renderCards(archived, "restore") : <div className="collection-empty" role="status"><span className="empty-column-icon" aria-hidden="true">✦</span><strong>Здесь пока пусто</strong><span>Архив пока пуст</span></div>}</div></section></Spin></>
          )}
        </Content>
      </Layout>

      <TaskModal open={modalOpen} task={editingTask} saving={saving} defaultDueDays={settings.dueDays} onCancel={() => setModalOpen(false)} onSubmit={submit} onDelete={editingTask ? remove : undefined} />
    </Layout>
  );
}
