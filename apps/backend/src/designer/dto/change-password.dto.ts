import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ minLength: 8 })
  newPassword: string;
}
