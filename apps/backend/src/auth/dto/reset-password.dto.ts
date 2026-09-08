import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw password-reset token from the email link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
