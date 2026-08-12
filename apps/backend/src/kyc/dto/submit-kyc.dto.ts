/**
 * submit-kyc.dto.ts
 * ---------------------------------------------------------------------------
 * DTO for a user's initial KYC submission (or re-submission after rejection).
 * Document files are handled separately via multipart/form-data; this DTO
 * carries the text business information fields only.
 * ---------------------------------------------------------------------------
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({ example: 'Acme Ltd.', description: 'Legal business or company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string;

  @ApiPropertyOptional({ example: 'RC12345678', description: 'Business registration number (optional)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiProperty({ example: 'Limited Liability Company', description: 'Type of business entity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessType: string;

  @ApiProperty({ example: '12 Commerce Street, Lagos Island', description: 'Full business address' })
  @IsString()
  @IsNotEmpty()
  businessAddress: string;

  @ApiProperty({ example: 'Nigeria', description: 'Country where the business is registered' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 'info@acme.com', description: 'Official business email address' })
  @IsEmail()
  businessEmail: string;

  @ApiProperty({ example: '+2348012345678', description: 'Business contact phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  businessPhone: string;

  @ApiProperty({
    example: 'We provide social media management solutions for SMBs across West Africa.',
    description: 'Short description of the business',
  })
  @IsString()
  @IsNotEmpty()
  businessDescription: string;
}
