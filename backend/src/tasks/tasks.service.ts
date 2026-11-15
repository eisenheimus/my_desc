import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TASK_STATUSES, TaskStatus } from '../task-status';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

const BOARD_STATUSES: TaskStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'DONE'];
const DEFAULT_PRIORITY = 'LOW';
const DEFAULT_COLOR = '#FFFFFF';
const DEFAULT_STATUS: TaskStatus = 'ASSIGNED';
const DUE_DATE_OFFSET_MS = 14 * 24 * 60 * 60 * 1000;

type TaskWithId = { id: number };
type TaskUpdateData = Prisma.TaskUpdateInput;

function dueInTwoWeeks(date: Date): Date {
  return new Date(date.getTime() + DUE_DATE_OFFSET_MS);
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.task.findMany({
      where: { status: { in: BOARD_STATUSES } },
      orderBy: this.boardOrderBy(),
    });
  }

  findBacklog() {
    return this.prisma.task.findMany({
      where: { status: 'BACKLOG' },
      orderBy: this.columnOrderBy(),
    });
  }

  findArchived() {
    return this.prisma.task.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: this.columnOrderBy(),
    });
  }

  async create(dto: CreateTaskDto) {
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const status = dto.status ?? DEFAULT_STATUS;
    const order = await this.prisma.task.count({ where: { status } });

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        status,
        priority: dto.priority ?? DEFAULT_PRIORITY,
        color: dto.color ?? DEFAULT_COLOR,
        order,
        createdAt,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : dueInTwoWeeks(createdAt),
      },
    });
  }

  async update(id: number, dto: UpdateTaskDto) {
    const task = await this.getOrFail(id);
    const nextStatus = dto.status ?? (task.status as TaskStatus);
    const fields = this.updateFields(dto);

    if (nextStatus === task.status) {
      return this.prisma.task.update({ where: { id }, data: fields });
    }

    return this.move(id, { status: nextStatus, order: 0, color: dto.color }, fields);
  }

  async move(id: number, dto: MoveTaskDto, extra: TaskUpdateData = {}) {
    const task = await this.getOrFail(id);
    const targetStatus = dto.status;
    const targetOrder = Math.max(0, dto.order ?? 0);

    return this.prisma.$transaction(async (tx) => {
      const source = await this.findOrderedTasks(tx, task.status);
      const sourceWithout = source.filter((item) => item.id !== id);
      const target = task.status === targetStatus
        ? sourceWithout
        : await this.findOrderedTasks(tx, targetStatus);
      const nextTarget = this.insertAt(target, task, targetOrder);
      const insertion = Math.min(targetOrder, target.length);

      await this.normalize(tx, sourceWithout, task.status as TaskStatus);
      await this.normalize(tx, nextTarget, targetStatus);

      return tx.task.update({
        where: { id },
        data: {
          status: targetStatus,
          order: insertion,
          ...(dto.color !== undefined && { color: dto.color }),
          ...extra,
        },
      });
    });
  }

  archive(id: number) {
    return this.move(id, { status: 'ARCHIVED', order: 0 });
  }

  restore(id: number) {
    return this.move(id, { status: 'DONE', order: 0 });
  }

  async remove(id: number) {
    const task = await this.getOrFail(id);

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.task.delete({ where: { id } });
      const rest = await this.findOrderedTasks(tx, task.status);
      await this.normalize(tx, rest, task.status as TaskStatus);
      return deleted;
    });
  }

  private boardOrderBy() {
    return [{ status: 'asc' as const }, { order: 'asc' as const }, { id: 'asc' as const }];
  }

  private columnOrderBy() {
    return [{ order: 'asc' as const }, { id: 'asc' as const }];
  }

  private findOrderedTasks(tx: Prisma.TransactionClient, status: string) {
    return tx.task.findMany({ where: { status }, orderBy: this.columnOrderBy() });
  }

  private updateFields(dto: UpdateTaskDto): TaskUpdateData {
    return {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description.trim() }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.createdAt !== undefined && { createdAt: new Date(dto.createdAt) }),
      ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
    };
  }

  private insertAt<T>(items: T[], item: T, order: number): T[] {
    const result = [...items];
    result.splice(Math.min(order, result.length), 0, item);
    return result;
  }

  private async getOrFail(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  private async normalize(
    tx: Prisma.TransactionClient,
    tasks: TaskWithId[],
    status: TaskStatus,
  ) {
    if (!TASK_STATUSES.includes(status)) {
      return;
    }

    for (const [index, item] of tasks.entries()) {
      await tx.task.update({
        where: { id: item.id },
        data: { status, order: index },
      });
    }
  }
}
