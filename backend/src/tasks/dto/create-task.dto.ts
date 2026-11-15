import {
  IsDateString,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../../task-status';

@ValidatorConstraint({ name: 'notWhitespaceOnly', async: false })
export class NotWhitespaceOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  defaultMessage(): string {
    return 'must contain at least one non-whitespace character';
  }
}

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  @Validate(NotWhitespaceOnlyConstraint)
  title: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  @Validate(NotWhitespaceOnlyConstraint)
  description: string;

  @IsOptional() @IsIn(TASK_STATUSES) status?: TaskStatus;
  @IsOptional() @IsIn(TASK_PRIORITIES) priority?: TaskPriority;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsDateString() createdAt?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
