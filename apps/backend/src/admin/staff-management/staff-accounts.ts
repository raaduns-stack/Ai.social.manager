export interface StaffAccount {
  id: string;
  email: string;
  fullName: string;
  department: string;
  roleId: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffDto {
  email: string;
  fullName: string;
  department: string;
  roleId: string;
}

export interface UpdateStaffDto {
  email?: string;
  fullName?: string;
  department?: string;
  roleId?: string;
}

export interface StaffRepository {
  findById(id: string): Promise<StaffAccount | null>;
  findByEmail(email: string): Promise<StaffAccount | null>;
  findAll(): Promise<StaffAccount[]>;
  create(data: Omit<StaffAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffAccount>;
  update(id: string, data: Partial<StaffAccount>): Promise<StaffAccount>;
}

export class ManageStaffAccountsService {
  constructor(private readonly repo: StaffRepository) {}

  async createStaff(dto: CreateStaffDto): Promise<StaffAccount> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new Error(`Staff account with email ${dto.email} already exists.`);
    }

    return this.repo.create({
      email: dto.email,
      fullName: dto.fullName,
      department: dto.department,
      roleId: dto.roleId,
      isEnabled: true,
    });
  }

  async getStaff(id: string): Promise<StaffAccount> {
    const staff = await this.repo.findById(id);
    if (!staff) {
      throw new Error(`Staff account with ID ${id} not found.`);
    }
    return staff;
  }

  async listStaff(): Promise<StaffAccount[]> {
    return this.repo.findAll();
  }

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<StaffAccount> {
    await this.getStaff(id);

    if (dto.email) {
      const existing = await this.repo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new Error(`Email ${dto.email} is already taken.`);
      }
    }

    return this.repo.update(id, {
      ...dto,
      updatedAt: new Date(),
    });
  }
}