export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminDto {
  email: string;
  fullName: string;
  roleId: string;
}

export interface UpdateAdminDto {
  email?: string;
  fullName?: string;
  roleId?: string;
}

export interface AdminRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  findAll(): Promise<AdminUser[]>;
  create(data: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser>;
  update(id: string, data: Partial<AdminUser>): Promise<AdminUser>;
}

export class ManageAdminUsersService {
  constructor(private readonly repo: AdminRepository) {}

  async createAdmin(dto: CreateAdminDto): Promise<AdminUser> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new Error(`Admin with email ${dto.email} already exists.`);
    }

    return this.repo.create({
      email: dto.email,
      fullName: dto.fullName,
      roleId: dto.roleId,
      isEnabled: true,
    });
  }

  async getAdmin(id: string): Promise<AdminUser> {
    const admin = await this.repo.findById(id);
    if (!admin) {
      throw new Error(`Admin user with ID ${id} not found.`);
    }
    return admin;
  }

  async listAdmins(): Promise<AdminUser[]> {
    return this.repo.findAll();
  }

  async updateAdmin(id: string, dto: UpdateAdminDto): Promise<AdminUser> {
    await this.getAdmin(id);

    if (dto.email) {
      const existing = await this.repo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new Error(`Email ${dto.email} is already in use by another user.`);
      }
    }

    return this.repo.update(id, {
      ...dto,
      updatedAt: new Date(),
    });
  }
}