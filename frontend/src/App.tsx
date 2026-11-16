import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Empty,
  Layout,
  message,
  Segmented,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  BulbOutlined,
  InboxOutlined,
  PlusOutlined,
  SettingOutlined,
  SunOutlined,
  UnorderedListOutlined,
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

interface AppProps {
  dark: boolean;
  onToggleTheme: () => void;
}

export default function App({ dark, onToggleTheme }: AppProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [archived, setArchived] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("board");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
  useEffect(() => {
    void load();
  }, [load]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const activeTask =
    [...tasks, ...backlog, ...archived].find((task) => task.id === activeId) ??
    null;
  const colorForStatus = (status: TaskStatus, current: string) =>
    status === "ASSIGNED"
      ? ENV_CARD_COLORS.created
      : status === "BACKLOG"
        ? ENV_CARD_COLORS.backlog
        : status === "ARCHIVED"
          ? ENV_CARD_COLORS.archived
          : current;
  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openSettings = () => setTab("settings");
  const goToBoard = () => setTab("board");
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };
  const handleDragStart = ({ active }: DragStartEvent) =>
    setActiveId(Number(active.id));
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const task = tasks.find((item) => item.id === Number(active.id));
    if (!task) return;
    const targetTask = tasks.find((item) => item.id === Number(over.id));
    const targetStatus = (targetTask?.status ?? over.id) as TaskStatus;
    if (!STATUS_COLUMNS.some((column) => column.key === targetStatus)) return;
    const targetColumn = tasks
      .filter((item) => item.status === targetStatus && item.id !== task.id)
      .sort((a, b) => a.order - b.order);
    const order = targetTask
      ? Math.max(
          0,
          targetColumn.findIndex((item) => item.id === targetTask.id),
        )
      : targetColumn.length;
    const previous = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: targetStatus,
              color: colorForStatus(targetStatus, item.color),
              order,
            }
          : item,
      ),
    );
    try {
      await api.move(
        task.id,
        targetStatus,
        order,
        colorForStatus(targetStatus, task.color),
      );
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
    } finally {
      setSaving(false);
    }
  };
  const remove = async (task: Task) => {
    setSaving(true);
    try {
      await api.remove(task.id);
      setModalOpen(false);
      await load();
      message.success("Задача удалена");
    } catch {
      message.error("Не удалось удалить задачу");
    } finally {
      setSaving(false);
    }
  };
  const archiveTask = async (task: Task) => {
    try {
      await api.archive(task.id);
      await load();
      message.success("Задача отправлена в архив");
    } catch {
      message.error("Не удалось архивировать задачу");
    }
  };
  const restore = async (task: Task) => {
    try {
      await api.restore(task.id);
      await load();
      message.success("Задача восстановлена");
    } catch {
      message.error("Не удалось восстановить задачу");
    }
  };
  const renderCards = (items: Task[], action?: "restore") =>
    items.length ? (
      items.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          assignedColor={ENV_CARD_COLORS.created}
          archivedColor={ENV_CARD_COLORS.archived}
          overdueColor={settings.overdueColor}
          cardPrefix={CARD_PREFIX}
          onOpen={openEdit}
          onRestore={action === "restore" ? restore : undefined}
          sortable={false}
        />
      ))
    ) : (
      <Empty description="Задач пока нет" />
    );
  const pageTitle =
    tab === "board"
      ? "Доска"
      : tab === "backlog"
        ? "Бэклог"
        : tab === "archive"
          ? "Архив"
          : "Настройки";
  const stats = (
    <div className="stats-row">
      <div>
        <span>Всего задач</span>
        <strong>{tasks.length}</strong>
      </div>
      <div>
        <span>В работе</span>
        <strong>
          {tasks.filter((task) => task.status === "IN_PROGRESS").length}
        </strong>
      </div>
      <div>
        <span>Завершено</span>
        <strong>{tasks.filter((task) => task.status === "DONE").length}</strong>
      </div>
    </div>
  );
  const navigation = (
    <div className="page-heading page-heading-compact">
      <h1>{pageTitle}</h1>
      <Segmented
        value={tab === "settings" ? "board" : tab}
        onChange={(value) => {
          if (value === "board" || value === "backlog" || value === "archive")
            setTab(value);
        }}
        options={[
          {
            label: (
              <span>
                <AppstoreOutlined /> Доска
              </span>
            ),
            value: "board",
          },
          {
            label: (
              <span>
                <UnorderedListOutlined /> Бэклог
              </span>
            ),
            value: "backlog",
          },
          {
            label: (
              <span>
                <InboxOutlined /> Архив <Tag>{archived.length}</Tag>
              </span>
            ),
            value: "archive",
          },
        ]}
      />
    </div>
  );
  const settingsPage = (
    <>
      <div className="stats-row">
        <div>
          <span>Всего задач</span>
          <strong>{tasks.length}</strong>
        </div>
        <div>
          <span>В работе</span>
          <strong>
            {tasks.filter((task) => task.status === "IN_PROGRESS").length}
          </strong>
        </div>
        <div>
          <span>Завершено</span>
          <strong>
            {tasks.filter((task) => task.status === "DONE").length}
          </strong>
        </div>
      </div>
      <div className="settings-page">
        <div className="column-header">
          <div className="column-title">Конфигурация доски</div>
        </div>
        <div className="settings-card">
          <label htmlFor="default-due-days">
            Контрольный срок по умолчанию, дней
            <input
              id="default-due-days"
              type="number"
              min="1"
              max="365"
              value={settings.dueDays}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  dueDays: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
          <label htmlFor="overdue-card-color">
            Цвет карточки при истечении дедлайна
            <input
              id="overdue-card-color"
              type="color"
              value={settings.overdueColor}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  overdueColor: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </div>
    </>
  );
  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-title">My desk</div>
          </div>
          <div className="header-actions">
            <Tooltip title={dark ? "Светлая тема" : "Тёмная тема"}>
              <Button
                aria-label="Переключить тему"
                type="text"
                icon={dark ? <SunOutlined /> : <BulbOutlined />}
                onClick={onToggleTheme}
              />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить задачу
            </Button>
            <Button
              aria-label="Настройки"
              type="text"
              icon={<SettingOutlined />}
              onClick={openSettings}
            />
          </div>
        </div>
      </Header>
      <Content className="content-wrap">
        {navigation}
        {tab === "settings" ? (
          <>
            <div className="settings-back-row">
              <Button type="link" icon={<AppstoreOutlined />} onClick={goToBoard}>Вернуться на доску</Button>
            </div>
            {settingsPage}
          </>
        ) : tab === "board" ? (
          <>
            {stats}
            <Spin spinning={loading}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
              >
                <div className="board">
                  {STATUS_COLUMNS.map((column) => (
                    <KanbanColumn
                      key={column.key}
                      status={column.key}
                      title={column.title}
                      accent={column.accent}
                      tasks={tasks
                        .filter((task) => task.status === column.key)
                        .sort((a, b) => a.order - b.order)}
                      onOpen={openEdit}
                      onArchive={archiveTask}
                      onAdd={openCreate}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <TaskCard
                      task={activeTask}
                       overdueColor={settings.overdueColor}
                      onOpen={() => undefined}
                      overlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Spin>
          </>
        ) : tab === "backlog" ? (
          <>
            {stats}
            <Spin spinning={loading}>
              <div className="collection-panel">
                <div className="column-header">
                  <div className="column-title">
                    Не назначенные задачи
                    <span className="column-count">{backlog.length}</span>
                  </div>
                </div>
                <div className="collection-cards">{backlog.length ? renderCards(backlog) : <div className="collection-empty" role="status"><span className="empty-column-icon" aria-hidden="true">✦</span><strong>Здесь пока пусто</strong><span>Добавьте новую задачу, чтобы начать работу</span></div>}</div>
              </div>
            </Spin>
          </>
        ) : (
          <>
            {stats}
            <Spin spinning={loading}>
              <div className="collection-panel">
                <div className="column-header">
                  <div className="column-title">
                    Архивные задачи
                    <span className="column-count">{archived.length}</span>
                  </div>
                </div>
                <div className="collection-cards">
                  {renderCards(archived, "restore")}
                </div>
              </div>
            </Spin>
          </>
        )}
      </Content>
      <TaskModal
        open={modalOpen}
        task={editingTask}
        saving={saving}
        defaultDueDays={settings.dueDays}
        onCancel={() => setModalOpen(false)}
        onSubmit={submit}
        onDelete={editingTask ? remove : undefined}
      />
    </Layout>
  );
}
