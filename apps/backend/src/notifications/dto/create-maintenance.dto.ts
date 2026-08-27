import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateMaintenanceDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
