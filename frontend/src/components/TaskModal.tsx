import { useEffect } from "react";
import {
  Button,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { DeleteOutlined } from "@ant-design/icons";
import type { Task, TaskPriority, TaskStatus } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../types";
export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  color: string;
  createdAt: Dayjs;
  dueDate: Dayjs;
}
interface Props {
  open: boolean;
  task: Task | null;
  saving?: boolean;
  defaultDueDays?: number;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onDelete?: (task: Task) => void | Promise<void>;
}
const statuses: TaskStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "DONE",
  "BACKLOG",
  "ARCHIVED",
];
export function TaskModal({
  open,
  task,
  saving,
  defaultDueDays = 14,
  onCancel,
  onSubmit,
  onDelete,
}: Props) {
  const [form] = Form.useForm<TaskFormValues>();
  useEffect(() => {
    if (open) {
      const created = task ? dayjs(task.createdAt) : dayjs();
      form.setFieldsValue({
        title: task?.title ?? "",
        description: task?.description ?? "",
        status: task?.status ?? "ASSIGNED",
        priority: task?.priority ?? "LOW",
        color: task?.color?.toUpperCase() ?? "#FFFFFF",
        createdAt: created,
        dueDate: task
          ? dayjs(task.dueDate)
          : created.add(defaultDueDays, "day"),
      });
    }
  }, [open, task, form, defaultDueDays]);
  const submit = async () => {
    const values = await form.validateFields();
    const color =
      typeof values.color === "string"
        ? values.color
        : "#FFFFFF";
    await onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      color,
    });
  };
  return (
    <Modal
      open={open}
      title={task ? "Редактировать задачу" : "Новая задача"}
      onCancel={onCancel}
      onOk={submit}
      okText={task ? "Сохранить" : "Создать"}
      cancelText="Отмена"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="title"
          label="Название"
          rules={[{ required: true, message: "Введите название задачи" }]}
        >
          <Input
            maxLength={120}
            showCount
            placeholder="Например, подготовить отчёт"
            autoFocus
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="Описание"
          rules={[{ required: true, message: "Введите описание задачи" }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="Подробности задачи"
          />
        </Form.Item>
        <Form.Item name="status" label="Состояние">
          <Select
            options={statuses.map((status) => ({
              value: status,
              label: STATUS_LABELS[status],
            }))}
          />
        </Form.Item>
        <Form.Item name="priority" label="Приоритет">
          <Select
            options={(["LOW", "MEDIUM", "HIGH"] as TaskPriority[]).map(
              (priority) => ({
                value: priority,
                label: PRIORITY_LABELS[priority],
              }),
            )}
          />
        </Form.Item>
        <Form.Item name="createdAt" label="Дата создания">
          <DatePicker
            showTime
            format="DD.MM.YYYY HH:mm"
            style={{ width: "100%" }}
            onChange={(date) => {
              if (date)
                form.setFieldValue("dueDate", date.add(defaultDueDays, "day"));
            }}
          />
        </Form.Item>
        <Form.Item name="dueDate" label="Контрольный срок">
          <DatePicker
            showTime
            format="DD.MM.YYYY HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item name="color" label="Цвет карточки">
          <ColorPicker
            format="hex"
            showText
            presets={[
              {
                label: "Палитра",
                colors: [
                  "#FFFFFF",
                  "#E0E7FF",
                  "#D1FAE5",
                  "#FEF3C7",
                  "#FCE7F3",
                  "#FEE2E2",
                  "#FFEDD5",
                  "#DBEAFE",
                  "#F3E8FF",
                ],
              },
            ]}
          />
        </Form.Item>
        {task && onDelete ? (
          <Popconfirm
            title="Удалить задачу?"
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(task)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Удалить задачу
            </Button>
          </Popconfirm>
        ) : null}
      </Form>
    </Modal>
  );
}
