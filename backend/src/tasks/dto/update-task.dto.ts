import {
  IsDateString,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../../task-status';
import { NotWhitespaceOnlyConstraint } from './create-task.dto';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  @Validate(NotWhitespaceOnlyConstraint)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  @Validate(NotWhitespaceOnlyConstraint)
  description?: string;

  @IsOptional() @IsIn(TASK_STATUSES) status?: TaskStatus;
  @IsOptional() @IsIn(TASK_PRIORITIES) priority?: TaskPriority;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsDateString() createdAt?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
