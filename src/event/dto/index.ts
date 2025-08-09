
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min, Max, IsNotEmpty, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PrizeDto {
  @IsNumber({}, { message: 'Position must be a number' })
  @Min(1, { message: 'Position must be at least 1' })
  position: number;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount must be non-negative' })
  amount: number;

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;
}

export class CreateEventDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description: string;

  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(500, { message: 'Location must not exceed 500 characters' })
  location?: string;

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate: string;

  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate: string;

  @IsOptional()
  @IsNumber({}, { message: 'Max participants must be a number' })
  @Min(1, { message: 'Max participants must be at least 1' })
  @Max(10000, { message: 'Max participants cannot exceed 10,000' })
  maxParticipants?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Prize pool must be a number' })
  @Min(0, { message: 'Prize pool must be non-negative' })
  prizePool?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Number of prizes must be a number' })
  @Min(0, { message: 'Number of prizes must be non-negative' })
  @Max(100, { message: 'Number of prizes cannot exceed 100' })
  numberOfPrizes?: number;

  @IsOptional()
  @IsArray({ message: 'Prizes must be an array' })
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  prizes?: PrizeDto[];
}

export class JoinEventDto {
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString({ message: 'Event ID must be a string' })
  eventId: string;
}

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;

  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString({ message: 'Event ID must be a string' })
  eventId: string;
}

export class CreateCommentReplyDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;

  @IsNotEmpty({ message: 'Comment ID is required' })
  @IsString({ message: 'Comment ID must be a string' })
  commentId: string;

  @IsOptional()
  @IsString({ message: 'Parent reply ID must be a string' })
  parentReplyId?: string;
}

export class UpdateEventStatusDto {
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString({ message: 'Event ID must be a string' })
  eventId: string;

  @IsNotEmpty({ message: 'Active status is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;
}

export class GetEventParticipantsDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number = 10;
}