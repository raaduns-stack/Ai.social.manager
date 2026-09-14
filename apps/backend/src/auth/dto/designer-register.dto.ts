import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class DesignerRegisterDto {
  @ApiProperty({ example: 'designer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alex Designer' })
  @IsNotEmpty()
  fullName: string;
}
