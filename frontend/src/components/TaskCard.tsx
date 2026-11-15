import type { CSSProperties, KeyboardEvent } from "react";
import { Button, Dropdown, Tag } from "antd";
import { InboxOutlined, MoreOutlined } from "@ant-design/icons";
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
  cardPrefix?: string;
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
  cardPrefix = "CARD-",
}: Props) {
  const sortable = useSortable({ id: task.id });
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
          ? "#ef7777"
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
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      className={`task-card${overlay ? " task-card-overlay" : ""}${archived ? " task-card-archived" : ""}${overdue ? " task-card-overdue" : ""}`}
      {...(overlay ? {} : sortable.attributes)}
      {...(overlay ? {} : sortable.listeners)}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={keyDown}
    >
      <div className="task-accent" />
      <div className="task-card-content">
        <div className="task-card-top">
          <span className="task-id">
            {cardPrefix}
            {String(task.id).padStart(3, "0")}
          </span>
          <span
            className={`priority-dot ${priorityClass[task.priority]}`}
            title={task.priority}
          />
          {items.length ? (
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(event) => event.stopPropagation()}
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
