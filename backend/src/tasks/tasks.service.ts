import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../task-status';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

const BOARD_STATUSES: TaskStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'DONE'];
const dueInTwoWeeks = (date: Date) => new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() { return this.prisma.task.findMany({ where: { status: { in: BOARD_STATUSES } }, orderBy: [{ status: 'asc' }, { order: 'asc' }, { id: 'asc' }] }); }
  findBacklog() { return this.prisma.task.findMany({ where: { status: 'BACKLOG' }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }); }
  findArchived() { return this.prisma.task.findMany({ where: { status: 'ARCHIVED' }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }); }

  async create(dto: CreateTaskDto) {
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const status = dto.status ?? 'ASSIGNED';
    const order = await this.prisma.task.count({ where: { status } });
    return this.prisma.task.create({ data: { title: dto.title.trim(), description: dto.description.trim(), status, priority: dto.priority ?? 'LOW', color: dto.color ?? '#FFFFFF', order, createdAt, dueDate: dto.dueDate ? new Date(dto.dueDate) : dueInTwoWeeks(createdAt) } });
  }

  async update(id: number, dto: UpdateTaskDto) {
    const task = await this.getOrFail(id);
    const nextStatus = dto.status ?? task.status as TaskStatus;
    const fields = { ...(dto.title !== undefined && { title: dto.title.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() }), ...(dto.priority !== undefined && { priority: dto.priority }), ...(dto.color !== undefined && { color: dto.color }), ...(dto.createdAt !== undefined && { createdAt: new Date(dto.createdAt) }), ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }) };
    if (nextStatus === task.status) return this.prisma.task.update({ where: { id }, data: fields });
    return this.move(id, { status: nextStatus, order: 0, color: dto.color }, fields);
  }

  async move(id: number, dto: MoveTaskDto, extra: Prisma.TaskUpdateInput = {}) {
    const task = await this.getOrFail(id);
    const targetStatus = dto.status;
    const targetOrder = Math.max(0, dto.order ?? 0);
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.task.findMany({ where: { status: task.status }, orderBy: [{ order: 'asc' }, { id: 'asc' }] });
      const sourceWithout = source.filter((item) => item.id !== id);
      const target = task.status === targetStatus ? sourceWithout : await tx.task.findMany({ where: { status: targetStatus }, orderBy: [{ order: 'asc' }, { id: 'asc' }] });
      const nextTarget = [...target]; const insertion = Math.min(targetOrder, nextTarget.length); nextTarget.splice(insertion, 0, task);
      await this.normalize(tx, sourceWithout, task.status as TaskStatus); await this.normalize(tx, nextTarget, targetStatus);
      return tx.task.update({ where: { id }, data: { status: targetStatus, order: insertion, ...(dto.color !== undefined && { color: dto.color }), ...extra } });
    });
  }
  archive(id: number) { return this.move(id, { status: 'ARCHIVED', order: 0 }); }
  restore(id: number) { return this.move(id, { status: 'DONE', order: 0 }); }
  async remove(id: number) { const task = await this.getOrFail(id); return this.prisma.$transaction(async (tx) => { const deleted = await tx.task.delete({ where: { id } }); const rest = await tx.task.findMany({ where: { status: task.status }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }); await this.normalize(tx, rest, task.status as TaskStatus); return deleted; }); }
  private async getOrFail(id: number) { const task = await this.prisma.task.findUnique({ where: { id } }); if (!task) throw new NotFoundException(`Task #${id} not found`); return task; }
  private async normalize(tx: Prisma.TransactionClient, tasks: Array<{ id: number }>, status: TaskStatus) { if (!TASK_STATUSES.includes(status)) return; for (const [index, item] of tasks.entries()) await tx.task.update({ where: { id: item.id }, data: { status, order: index } }); }
}
