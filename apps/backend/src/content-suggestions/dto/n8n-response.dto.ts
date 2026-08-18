import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class N8nVariationItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  hashtags!: string[];

  @ApiProperty()
  @IsEnum(['caption', 'idea'])
  type!: 'caption' | 'idea';
}

export class N8nResponseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  parentVariationId?: string;

  @ApiProperty({ type: [N8nVariationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => N8nVariationItemDto)
  variations!: N8nVariationItemDto[];
}
