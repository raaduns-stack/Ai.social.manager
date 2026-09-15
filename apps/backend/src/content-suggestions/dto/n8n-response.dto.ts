import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SuggestionVariationDto {
  @ApiProperty({ example: '5 Steps to Automate Your Workflow', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Want to master workflow automation? Here are 5 simple steps...', required: false })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'Want to master workflow automation? Here are 5 simple steps...', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: ['#automation', '#tech'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiProperty({ enum: ['caption', 'idea'], required: false })
  @IsEnum(['caption', 'idea'])
  @IsOptional()
  type?: 'caption' | 'idea';
}

export type N8nVariationItemDto = SuggestionVariationDto;
export const N8nVariationItemDto = SuggestionVariationDto;

export class N8nResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  postId!: string;

  @ApiProperty({ example: '987f6543-e21b-34c5-d678-987654321000' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentVariationId?: string;

  @ApiProperty({ type: [SuggestionVariationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestionVariationDto)
  variations!: SuggestionVariationDto[];
}
