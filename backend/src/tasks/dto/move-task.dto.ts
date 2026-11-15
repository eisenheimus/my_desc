import { IsHexColor, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { TASK_STATUSES, TaskStatus } from '../../task-status';

export class MoveTaskDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsIn(TASK_STATUSES)
  status: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
