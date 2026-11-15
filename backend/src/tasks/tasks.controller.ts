import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('backlog')
  findBacklog() {
    return this.tasksService.findBacklog();
  }

  @Get('archived')
  findArchived() {
    return this.tasksService.findArchived();
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() dto: MoveTaskDto) {
    if (dto.id === undefined) {
      throw new BadRequestException('id is required for reorder');
    }
    return this.tasksService.move(dto.id, dto);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.archive(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.restore(id);
  }

  @Patch(':id/move')
  move(@Param('id', ParseIntPipe) id: number, @Body() dto: MoveTaskDto) {
    return this.tasksService.move(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}
