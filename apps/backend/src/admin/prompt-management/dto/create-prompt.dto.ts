import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePromptDto {
  // ==================================================
  // Name shown to the admin.
  // Example: "Instagram Caption Generator"
  // ==================================================
  @IsString()
  name!: string;

  // ==================================================
  // Category used to organize prompts.
  // Example: Instagram, Facebook, LinkedIn
  // ==================================================
  @IsString()
  category!: string;

  // ==================================================
  // The actual AI prompt template.
  // ==================================================
  @IsString()
  prompt!: string;

  // ==================================================
  // Whether this prompt is active.
  // Defaults to true if not provided.
  // ==================================================
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}