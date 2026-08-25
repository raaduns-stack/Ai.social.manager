import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RolePermissionItemDto {
  @IsString()
  @IsNotEmpty()
  module: string;

  @IsString()
  @IsNotEmpty()
  accessLevel: string;
}

export class UpdateRolePermissionsDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  permissions: RolePermissionItemDto[];
}
