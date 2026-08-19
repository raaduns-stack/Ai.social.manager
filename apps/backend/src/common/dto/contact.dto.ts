import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Sender full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Sender email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Sender company name', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'Hello, I have a question about pricing.', description: 'Message body' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
