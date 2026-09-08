import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentMethodDto {
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  bankName: string;

  @IsString()
  @MaxLength(50)
  @ApiProperty()
  accountNumber: string;

  @IsString()
  @MaxLength(255)
  @ApiProperty()
  accountName: string;
}
