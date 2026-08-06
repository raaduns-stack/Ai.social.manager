import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
/**
 * Defines the allowed reaction types for feedback.
 */
export enum FeedbackReaction {
  UP = 'up',
  DOWN = 'down',
}
/**
 * Data Transfer Object (DTO) for creating a new feedback entry.
 * Validates request payload structures and documents API endpoints in Swagger.
 */
export class CreateFeedbackDto {
  /**
   * The user's thumbs-up or thumbs-down reaction.
   */
  @ApiProperty({
    enum: FeedbackReaction,
  })
  @IsEnum(FeedbackReaction)
  reaction!: FeedbackReaction;

  /**
   * Numerical rating given by the user on a scale of 1 to 5.
   */
  @ApiProperty({
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}