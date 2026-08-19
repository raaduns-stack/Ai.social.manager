import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../mailer/mailer.service';
import { LoginHistoryService } from '../login-history/login-history.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UserRole } from '../common/enums/roles.enum';

describe('AuthService Security - Role Isolation', () => {
  let authService: AuthService;
  let dbMock: any;

  beforeEach(async () => {
    const returningMock = jest.fn().mockResolvedValue([
      {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.USER,
      },
    ]);
    const valuesMock = jest.fn().mockReturnValue({
      returning: returningMock,
    });
    dbMock = {
      query: {
        users: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        plans: {
          findFirst: jest.fn().mockResolvedValue({ id: 'plan-123', slug: 'free' }),
        },
        subscriptions: {
          findFirst: jest.fn().mockResolvedValue({ id: 'sub-123', plan: { id: 'plan-123', name: 'Free' } }),
        },
        rolePermissions: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: valuesMock,
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User',
                role: UserRole.USER,
              },
            ]),
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('dummy_secret'),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendVerificationCode: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LoginHistoryService,
          useValue: {},
        },
        {
          provide: ActivityLogsService,
          useValue: {
            record: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should ignore any "role" property passed in the registration payload and write no "role" value to database', async () => {
    const registerPayload = {
      email: 'hacker@example.com',
      password: 'strong-password-123',
      fullName: 'Evil Attacker',
      role: UserRole.SUPER_ADMIN,
    };

    await authService.register(registerPayload as any);

    expect(dbMock.insert).toHaveBeenCalledWith(schema.users);

    const insertMock = dbMock.insert();
    const valuesCallArg = insertMock.values.mock.calls[0][0];

    expect(valuesCallArg.role).toBeUndefined();
    expect(valuesCallArg).not.toHaveProperty('role');
    expect(valuesCallArg.email).toBe(registerPayload.email);
    expect(valuesCallArg.fullName).toBe(registerPayload.fullName);
  });

  it('should ignore any "role" property passed in the change-password payload and write no "role" value to database', async () => {
    const passwordHash = await require('bcrypt').hash('currentPassword123', 10);
    dbMock.query.users.findFirst.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      passwordHash,
      role: UserRole.USER,
    });

    const changePasswordPayload = {
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword12345',
      role: UserRole.SUPER_ADMIN,
    };

    await authService.changePassword('user-123', changePasswordPayload as any);

    expect(dbMock.update).toHaveBeenCalledWith(schema.users);

    const updateMock = dbMock.update();
    const setCallArg = updateMock.set.mock.calls[0][0];

    expect(setCallArg.role).toBeUndefined();
    expect(setCallArg).not.toHaveProperty('role');
    expect(setCallArg.passwordHash).toBeDefined();
  });
});
