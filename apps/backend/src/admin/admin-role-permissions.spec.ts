import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { DATABASE_CONNECTION } from '../database/database.module';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import * as schema from '../database/schema';

describe('AdminController - Role Permissions Roundtrip', () => {
  let controller: AdminController;
  let service: AdminService;
  let dbStore: any[];

  beforeEach(async () => {
    dbStore = [
      { id: '1', role: 'reviewer', module: 'billing', accessLevel: 'none' },
    ];

    const dbMock = {
      query: {
        rolePermissions: {
          findMany: jest.fn().mockImplementation(() => {
            return Promise.resolve(dbStore);
          }),
          findFirst: jest.fn().mockImplementation(() => {
            return Promise.resolve(dbStore[0] || null);
          }),
        },
      },
      insert: jest.fn().mockImplementation(() => {
        return {
          values: jest.fn().mockImplementation((val) => {
            const newItem = { id: Math.random().toString(), ...val };
            dbStore.push(newItem);
            return Promise.resolve([newItem]);
          }),
        };
      }),
      update: jest.fn().mockImplementation(() => {
        return {
          set: jest.fn().mockImplementation((setVal) => {
            return {
              where: jest.fn().mockImplementation(() => {
                if (dbStore[0]) {
                  Object.assign(dbStore[0], setVal);
                }
                return Promise.resolve();
              }),
            };
          }),
        };
      }),
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
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  describe('update and get permissions roundtrip', () => {
    it('should update permissions in DB and return the updated value when calling getRolePermissions', async () => {
      // 1. Verify initial access level is 'none'
      const initialPermissions = await controller.getRolePermissions();
      const reviewerBillingInitial = initialPermissions.find(
        (x) => x.role === 'reviewer' && x.module === 'billing',
      );
      expect(reviewerBillingInitial).toBeDefined();
      expect(reviewerBillingInitial?.accessLevel).toBe('none');

      // 2. Perform PATCH update to change it to 'full'
      const dto: UpdateRolePermissionsDto = {
        role: 'reviewer',
        permissions: [
          { module: 'billing', accessLevel: 'full' },
        ],
      };
      await controller.updateRolePermissions(dto);

      // 3. Call GET endpoint and assert that it now returns 'full'
      const updatedPermissions = await controller.getRolePermissions();
      const reviewerBillingAfter = updatedPermissions.find(
        (x) => x.role === 'reviewer' && x.module === 'billing',
      );
      expect(reviewerBillingAfter).toBeDefined();
      expect(reviewerBillingAfter?.accessLevel).toBe('full');
    });
  });
});
