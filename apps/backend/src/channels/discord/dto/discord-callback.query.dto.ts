import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DiscordCallbackQueryDto {
  @ApiPropertyOptional({ description: 'OAuth2 authorization code returned by Discord' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Signed state JWT to verify request integrity and user session' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Guild ID if bot was added to a server during authorization' })
  @IsString()
  @IsOptional()
  guild_id?: string;

  @ApiPropertyOptional({ description: 'Permissions integer granted during authorization' })
  @IsString()
  @IsOptional()
  permissions?: string;

  @ApiPropertyOptional({ description: 'Error code returned if authorization was denied' })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({ description: 'Human-readable description of authorization error' })
  @IsString()
  @IsOptional()
  error_description?: string;
}
