import { Test, TestingModule } from '@nestjs/testing';
import { CustomerProfileService } from './customer-profile.service';
import { KycService } from '../../kyc/kyc.service';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

describe('CustomerProfileService Security - Role Isolation', () => {
  let service: CustomerProfileService;
  let dbMock: any;
  let kycServiceMock: any;

  beforeEach(async () => {
    dbMock = {
      query: {
        customerCompanyProfile: {
          findFirst: jest.fn(),
        },
      },
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'profile-123',
                userId: 'user-123',
                businessName: 'My Business',
              },
            ]),
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: 'profile-123',
            userId: 'user-123',
            businessName: 'My Business',
          },
        ]),
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'profile-123',
              userId: 'user-123',
              businessName: 'My Business',
            },
          ]),
        }),
      }),
    };

    kycServiceMock = {
      getKycStatus: jest.fn().mockResolvedValue('approved'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProfileService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: KycService,
          useValue: kycServiceMock,
        },
      ],
    }).compile();

    service = module.get<CustomerProfileService>(CustomerProfileService);
  });

  it('should ignore any "role" property passed in the profile update payload and write no "role" values to database', async () => {
    dbMock.query.customerCompanyProfile.findFirst.mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123',
      businessName: 'My Business',
    });

    const updatePayload = {
      businessName: 'My Business',
      logoUrl: 'https://newlogo.png',
      role: 'super_admin',
    };

    await service.updateCompanyProfile('user-123', updatePayload as any);

    expect(dbMock.update).toHaveBeenCalledWith(schema.customerCompanyProfile);
    expect(dbMock.update).not.toHaveBeenCalledWith(schema.users);

    const updateMock = dbMock.update();
    const setCallArg = updateMock.set.mock.calls[0][0];

    expect(setCallArg.role).toBeUndefined();
    expect(setCallArg).not.toHaveProperty('role');
  });
});
