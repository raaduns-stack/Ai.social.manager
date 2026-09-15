import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateGraphicsConversionDto {
  @ApiProperty({
    description: 'Approved or completed submission to request a code conversion for',
  })
  @IsUUID()
  submissionId: string;
}
