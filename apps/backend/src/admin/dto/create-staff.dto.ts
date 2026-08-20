import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
