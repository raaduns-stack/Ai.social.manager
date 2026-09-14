import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DesignerActivateDto {
  @ApiProperty({ description: 'Raw invitation token from the activation link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'Alex Designer' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
