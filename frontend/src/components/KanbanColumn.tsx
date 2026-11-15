import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

interface Props {
  status: TaskStatus;
  title: string;
  accent: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onArchive: (task: Task) => void;
  onAdd: () => void;
}

export function KanbanColumn({
  status,
  title,
  accent,
  tasks,
  onOpen,
  onArchive,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`kanban-column${isOver ? " is-over" : ""}`}
      style={{ "--column-accent": accent } as React.CSSProperties}
      aria-label={title}
    >
      <div className="column-header">
        <div className="column-title">
          {title}
          <span className="column-count">{tasks.length}</span>
        </div>
      </div>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column-body">
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={onOpen}
                onArchive={status === "DONE" ? onArchive : undefined}
              />
            ))
          ) : (
            <div className="empty-column">Перетащите задачу сюда</div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
