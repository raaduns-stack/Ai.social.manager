import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  message: string; // Initial ticket message

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Priority must be either low, medium, or high',
  })
  priority?: 'low' | 'medium' | 'high';
}
