import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SelectTumblrBlogDto {
  @ApiProperty({
    description: 'The target Tumblr blog name (e.g. mycompanyblog)',
    example: 'mycompanyblog',
  })
  @IsString()
  @IsNotEmpty()
  blogName: string;
}
