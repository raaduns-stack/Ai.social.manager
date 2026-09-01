import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UserRole } from '../common/enums/roles.enum';
import { DATABASE_CONNECTION } from '../database/database.module';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import * as schema from '../database/schema';

describe('AdminStaffSecurity - Staff Account Creation', () => {
  let controller: AdminController;
  let service: AdminService;
  let dbMock: any;
  let activityLogsMock: any;

  beforeEach(async () => {
    dbMock = {
      transaction: jest.fn().mockImplementation((cb) => cb(dbMock)),
      query: {
        users: {
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'new-staff-123',
              email: 'newstaff@example.com',
              fullName: 'New Staff',
              role: UserRole.REVIEWER,
            },
          ]),
        }),
      }),
    };

    activityLogsMock = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: ActivityLogsService,
          useValue: activityLogsMock,
        },
        {
          provide: AuthService,
          useValue: { register: jest.fn(), applyUserStatusTransition: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  describe('RBAC Guards assertion', () => {
    it('should have @Roles(UserRole.SUPER_ADMIN) on createStaff method', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(ROLES_KEY, controller.createStaff);
      expect(roles).toEqual([UserRole.SUPER_ADMIN]);
    });

    it('should have @Roles(UserRole.SUPER_ADMIN) on updateRolePermissions method', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(ROLES_KEY, controller.updateRolePermissions);
      expect(roles).toEqual([UserRole.SUPER_ADMIN]);
    });
  });

  describe('createStaff logic validation', () => {
    const validDto: CreateStaffDto = {
      email: 'newstaff@example.com',
      fullName: 'New Staff',
      password: 'strong-password-123',
      role: UserRole.REVIEWER,
    };

    it('should successfully create staff for allowed roles', async () => {
      dbMock.query.users.findFirst.mockResolvedValue(null);

      const result = await service.createStaff(validDto);

      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.REVIEWER);
      expect(dbMock.insert).toHaveBeenCalledWith(schema.users);
    });

    it('should throw BadRequestException if a non-staff role (e.g. user) is provided', async () => {
      const badDto = { ...validDto, role: UserRole.USER };

      await expect(service.createStaff(badDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if the email is already registered', async () => {
      dbMock.query.users.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(service.createStaff(validDto)).rejects.toThrow(ConflictException);
    });
  });
});
