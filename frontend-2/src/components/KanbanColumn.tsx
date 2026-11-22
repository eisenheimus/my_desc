import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { TaskCard } from "./TaskCard";

interface Props {
  status: TaskStatus;
  title: string;
  accent: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onArchive: (task: Task) => void;
  onAdd: () => void;
  loading?: boolean;
}

export function KanbanColumn({
  status,
  title,
  accent,
  tasks,
  onOpen,
  onArchive,
  onAdd,
  loading = false,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`kanban-column${isOver ? " is-over" : ""}`}
      style={{ "--column-accent": accent } as React.CSSProperties}
      aria-label={`${title}, ${tasks.length} задач`}
    >
      <div className="column-header">
        <div className="column-title" id={`column-${status}`}>
          <span className="column-accent" aria-hidden="true" />
          {title}
          <span className="column-count" aria-label={`${tasks.length} задач`}>{tasks.length}</span>
        </div>
        <Button
          className="column-add"
          type="text"
          size="small"
          icon={<PlusOutlined />}
          aria-label={`Добавить задачу в колонку «${title}»`}
          onClick={onAdd}
        />
      </div>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column-body" aria-labelledby={`column-${status}`}>
          {loading ? (
            <div className="column-state" role="status" aria-live="polite">
              <span className="loading-skeleton" />
              <span className="loading-skeleton short" />
              Загрузка задач…
            </div>
          ) : tasks.length ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={onOpen}
                onArchive={status === "DONE" ? onArchive : undefined}
                sortable
              />
            ))
          ) : (
            <div className="empty-column" role="status">
              <span className="empty-column-icon" aria-hidden="true">✦</span>
              <strong>Здесь пока пусто</strong>
              <span>Перетащите задачу сюда или добавьте новую</span>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
