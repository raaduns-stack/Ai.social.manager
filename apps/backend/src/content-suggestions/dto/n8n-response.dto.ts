import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestionVariationDto {
  @ApiProperty({ example: '5 Steps to Automate Your Workflow', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Want to master workflow automation? Here are 5 simple steps...' })
  @IsString()
  @IsNotEmpty()
  caption!: string;

  @ApiProperty({ example: ['#automation', '#tech'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];
}

export class N8nResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  postId!: string;

  @ApiProperty({ example: '987f6543-e21b-34c5-d678-987654321000' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ type: [SuggestionVariationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestionVariationDto)
  variations!: SuggestionVariationDto[];
}
