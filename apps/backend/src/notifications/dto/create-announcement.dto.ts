import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];

  @IsIn(['EMAIL', 'IN_APP', 'BOTH'])
  channel: 'EMAIL' | 'IN_APP' | 'BOTH';
}
