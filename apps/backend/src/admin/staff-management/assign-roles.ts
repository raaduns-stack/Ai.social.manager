export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface RoleAssignmentRepository {
  findUserById(userId: string): Promise<{ id: string; roleId: string } | null>;
  findRoleById(roleId: string): Promise<{ id: string; name: string } | null>;
  updateUserRole(userId: string, roleId: string): Promise<void>;
  logAssignment(record: UserRoleAssignment): Promise<void>;
}

export class AssignRolesService {
  constructor(private readonly repo: RoleAssignmentRepository) {}

  async assignRole(userId: string, roleId: string, adminId: string): Promise<UserRoleAssignment> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new Error(`Target user with ID ${userId} does not exist.`);
    }

    const role = await this.repo.findRoleById(roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} does not exist.`);
    }

    if (user.roleId === roleId) {
      throw new Error(`User already holds the role '${role.name}'.`);
    }

    await this.repo.updateUserRole(userId, roleId);

    const assignmentRecord: UserRoleAssignment = {
      userId,
      roleId,
      assignedBy: adminId,
      assignedAt: new Date(),
    };

    await this.repo.logAssignment(assignmentRecord);
    return assignmentRecord;
  }
}