import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTumblrPostDto {
  @ApiPropertyOptional({
    description: 'Target Tumblr blog name (identifier). Optional if already configured for user.',
    example: 'myawesomeblog',
  })
  @IsString()
  @IsOptional()
  blogName?: string;

  @ApiProperty({
    description: 'Text content/body of the Tumblr post',
    example: 'Check out our latest update from RaaSocial!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Optional Title for text/link post',
    example: 'RaaSocial Update',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional Image URL for photo posts',
    example: 'https://example.com/image.png',
  })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Post type: text, photo, link',
    example: 'text',
    default: 'text',
  })
  @IsString()
  @IsOptional()
  type?: 'text' | 'photo' | 'link';
}
