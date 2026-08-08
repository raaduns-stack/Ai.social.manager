import { Test, TestingModule } from '@nestjs/testing';
import { AutoCloseTicketsJob } from './auto-close-tickets.job';
import { DATABASE_CONNECTION } from '../../database/database.module';

describe('AutoCloseTicketsJob', () => {
  let job: AutoCloseTicketsJob;
  
  const mockDb = {
    query: {
      supportTickets: {
        findMany: jest.fn(),
      },
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoCloseTicketsJob,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    job = module.get<AutoCloseTicketsJob>(AutoCloseTicketsJob);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  it('should query for resolved tickets older than 72 hours and update them to closed', async () => {
    // Mock the DB returning two tickets that are older than 72 hours
    const oldTicketIds = [{ id: 'ticket-1' }, { id: 'ticket-2' }];
    mockDb.query.supportTickets.findMany.mockResolvedValue(oldTicketIds);

    await job.handleCron();

    // Verify findMany was called
    expect(mockDb.query.supportTickets.findMany).toHaveBeenCalled();

    // Verify update was called for each old ticket
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(mockDb.set).toHaveBeenCalledWith({
      status: 'closed',
      updatedAt: expect.any(Date),
    });
    
    // Verify where clause was called twice (once for each id)
    expect(mockDb.where).toHaveBeenCalledTimes(2);
  });

  it('should not update anything if no tickets are older than 72 hours', async () => {
    // Mock the DB returning empty (e.g. no tickets older than 72h)
    mockDb.query.supportTickets.findMany.mockResolvedValue([]);

    await job.handleCron();

    // Verify findMany was called
    expect(mockDb.query.supportTickets.findMany).toHaveBeenCalled();

    // Verify update was NEVER called
    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockDb.set).not.toHaveBeenCalled();
    expect(mockDb.where).not.toHaveBeenCalled();
  });
});
