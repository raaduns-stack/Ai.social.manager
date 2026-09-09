export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';

export interface Permission {
  id: string;
  module: string; // e.g., 'CONTENT', 'USERS', 'ANNOUNCEMENTS'
  action: PermissionAction;
  description: string;
}

export interface RolePermissionsConfig {
  roleId: string;
  roleName: string;
  permissionIds: string[];
  updatedAt: Date;
}

export interface PermissionsRepository {
  findRoleConfig(roleId: string): Promise<RolePermissionsConfig | null>;
  saveRoleConfig(config: RolePermissionsConfig): Promise<RolePermissionsConfig>;
  validatePermissionIds(ids: string[]): Promise<boolean>;
}

export class RolePermissionsService {
  constructor(private readonly repo: PermissionsRepository) {}

  async updateRolePermissions(
    roleId: string,
    roleName: string,
    permissionIds: string[]
  ): Promise<RolePermissionsConfig> {
    const isValid = await this.repo.validatePermissionIds(permissionIds);
    if (!isValid) {
      throw new Error('One or more permission IDs are invalid.');
    }

    const config: RolePermissionsConfig = {
      roleId,
      roleName,
      permissionIds: Array.from(new Set(permissionIds)), // Remove duplicates
      updatedAt: new Date(),
    };

    return this.repo.saveRoleConfig(config);
  }

  async getPermissionsForRole(roleId: string): Promise<RolePermissionsConfig> {
    const config = await this.repo.findRoleConfig(roleId);
    if (!config) {
      throw new Error(`Permissions configuration for role ${roleId} not found.`);
    }
    return config;
  }
}