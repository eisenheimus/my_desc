import { IsDateString, IsHexColor, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../../task-status';

export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() @MinLength(1) description?: string;
  @IsOptional() @IsIn(TASK_STATUSES) status?: TaskStatus;
  @IsOptional() @IsIn(TASK_PRIORITIES) priority?: TaskPriority;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsDateString() createdAt?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
