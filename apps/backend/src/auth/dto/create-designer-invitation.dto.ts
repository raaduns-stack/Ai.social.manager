import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateDesignerInvitationDto {
  @ApiProperty({ example: 'designer@example.com' })
  @IsEmail()
  email: string;
}
