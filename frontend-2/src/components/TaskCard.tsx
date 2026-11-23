import type { CSSProperties, KeyboardEvent } from "react";
import { Button, Dropdown } from "antd";
import { InboxOutlined, MoreOutlined, HolderOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onRestore?: (task: Task) => void;
  overlay?: boolean;
  assignedColor?: string;
  archivedColor?: string;
  overdueColor?: string;
  cardPrefix?: string;
  collection?: boolean;
  sortable?: boolean;
}
const priorityClass = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
} as const;
export function TaskCard({
  task,
  onOpen,
  onArchive,
  onRestore,
  overlay,
  assignedColor = "#5F76FC",
  archivedColor = "#000000",
  overdueColor = "#ef7777",
  cardPrefix = "CARD-",
  collection = false,
  sortable: enableSorting = true,
}: Props) {
  const sortable = useSortable({ id: task.id, disabled: !enableSorting });
  const archived = task.status === "ARCHIVED";
  const overdue = !archived && new Date(task.dueDate).getTime() < Date.now();
  const style: CSSProperties = {
    transform: overlay ? undefined : CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.35 : 1,
    "--task-color": archived
      ? archivedColor
      : task.status === "ASSIGNED"
        ? assignedColor
        : overdue
          ? overdueColor
          : task.color,
  } as CSSProperties;
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(task);
    }
  };
  const items = onRestore
    ? [
        {
          key: "restore",
          icon: <InboxOutlined />,
          label: "Восстановить",
          onClick: () => onRestore(task),
        },
      ]
    : onArchive
      ? [
          {
            key: "archive",
            icon: <InboxOutlined />,
            label: "В архив",
            onClick: () => onArchive(task),
          },
        ]
      : [];
  return (
    <div
      ref={overlay || !enableSorting ? undefined : sortable.setNodeRef}
      style={style}
      className={`task-card${overlay ? " task-card-overlay" : ""}${archived ? " task-card-archived" : ""}${overdue ? " task-card-overdue" : ""}${collection ? " task-card-collection" : ""}`}
      {...(overlay || !enableSorting ? {} : sortable.attributes)}
      {...(overlay || !enableSorting ? {} : sortable.listeners)}
      role="button"
      tabIndex={0}
      aria-label={`${task.title}, приоритет ${task.priority === "HIGH" ? "высокий" : task.priority === "MEDIUM" ? "средний" : "низкий"}${overdue ? ", просрочено" : ""}`}
      onClick={() => onOpen(task)}
      onKeyDown={keyDown}
    >
      <div className="task-accent" aria-hidden="true" />
      <div className="task-card-content">
        <div className="task-card-top">
          <span className="drag-handle" aria-hidden="true"><HolderOutlined /></span>
          <span className="task-id">
            {cardPrefix}
            {String(task.id).padStart(3, "0")}
          </span>
          <span
            className={`priority-dot ${priorityClass[task.priority]}${collection ? " priority-dot-collection" : ""}`}
            title={`Приоритет: ${task.priority}`}
             aria-label={`Приоритет: ${task.priority}`}
          />
          {items.length ? (
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                aria-label="Действия с задачей"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </Dropdown>
          ) : null}
        </div>
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-footer task-description-preview">
          {task.description}
        </div>
      </div>
    </div>
  );
}
