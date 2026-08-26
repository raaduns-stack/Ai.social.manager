import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendDiscordMessageDto {
  @ApiProperty({
    description: 'Target Discord Channel ID',
    example: '123456789012345678',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({
    description: 'Message content to post to the Discord channel',
    example: 'Hello from RaaSocial!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
