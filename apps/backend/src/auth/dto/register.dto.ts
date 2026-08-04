import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: "Ada's Bakery", required: false })
  @IsOptional()
  @IsString()
  businessName?: string;
}