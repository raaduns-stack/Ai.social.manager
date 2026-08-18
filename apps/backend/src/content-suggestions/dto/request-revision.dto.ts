import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestRevisionDto {
  @ApiProperty({
    description: 'The instructions or feedback on how to revise the content suggestion',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  revisionNotes!: string;
}
