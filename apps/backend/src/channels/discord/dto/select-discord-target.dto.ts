import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SelectDiscordTargetDto {
  @ApiProperty({ description: 'The Discord Guild (Server) ID' })
  @IsString()
  @IsNotEmpty()
  guildId: string;

  @ApiProperty({ description: 'The Discord Channel ID (optional if selecting guild default)' })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty({ description: 'Optional Guild Name for display' })
  @IsString()
  @IsOptional()
  guildName?: string;

  @ApiProperty({ description: 'Optional Channel Name for display' })
  @IsString()
  @IsOptional()
  channelName?: string;
}
