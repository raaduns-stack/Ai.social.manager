import { Test, TestingModule } from '@nestjs/testing';
import { AdminSupportController } from './admin-support.controller';
import { SupportService } from '../../support/support.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole } from '../../common/enums/roles.enum';

describe('AdminSupportController - Ticket Assignment RBAC', () => {
  let controller: AdminSupportController;
  let service: SupportService;

  const mockSupportService = {
    assignTicket: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    }).compile();

    controller = module.get<AdminSupportController>(AdminSupportController);
    service = module.get<SupportService>(SupportService);
    
    jest.clearAllMocks();
  });

  describe('assignTicket', () => {
    const ticketId = 'ticket-123';
    const otherStaffId = 'staff-456';

    it('should allow super_admin to assign a ticket to another staff member (200)', async () => {
      const admin = { userId: 'admin-123', role: UserRole.SUPER_ADMIN };
      mockSupportService.assignTicket.mockResolvedValue({ id: ticketId, assignedToStaffId: otherStaffId });

      const result = await controller.assignTicket(admin, ticketId, { assigneeId: otherStaffId });
      
      expect(service.assignTicket).toHaveBeenCalledWith(admin, ticketId, otherStaffId);
      expect(result).toEqual({ id: ticketId, assignedToStaffId: otherStaffId });
    });

    it('should allow super_admin to reassign a ticket already claimed by someone else (200)', async () => {
      const admin = { userId: 'admin-123', role: UserRole.SUPER_ADMIN };
      // Simulating reassignment to a third staff member
      const newStaffId = 'staff-789';
      mockSupportService.assignTicket.mockResolvedValue({ id: ticketId, assignedToStaffId: newStaffId });

      const result = await controller.assignTicket(admin, ticketId, { assigneeId: newStaffId });
      
      expect(service.assignTicket).toHaveBeenCalledWith(admin, ticketId, newStaffId);
      expect(result).toEqual({ id: ticketId, assignedToStaffId: newStaffId });
    });

    it('should allow account_manager to self-claim an unassigned ticket (200)', async () => {
      const admin = { userId: 'am-123', role: UserRole.ACCOUNT_MANAGER };
      mockSupportService.assignTicket.mockResolvedValue({ id: ticketId, assignedToStaffId: admin.userId });

      const result = await controller.assignTicket(admin, ticketId, { assigneeId: admin.userId });
      
      expect(service.assignTicket).toHaveBeenCalledWith(admin, ticketId, admin.userId);
      expect(result).toEqual({ id: ticketId, assignedToStaffId: admin.userId });
    });

    it('should deny account_manager from assigning a ticket to someone else (403)', async () => {
      const admin = { userId: 'am-123', role: UserRole.ACCOUNT_MANAGER };
      mockSupportService.assignTicket.mockRejectedValue(
        new ForbiddenException({
          message: 'You can only assign tickets to yourself',
          code: 'ASSIGNMENT_NOT_PERMITTED',
        })
      );

      await expect(
        controller.assignTicket(admin, ticketId, { assigneeId: otherStaffId })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny account_manager from reassigning a ticket already claimed by someone else (403)', async () => {
      const admin = { userId: 'am-123', role: UserRole.ACCOUNT_MANAGER };
      // Although the actual checking logic is in the service, we mock the service throwing the expected error
      mockSupportService.assignTicket.mockRejectedValue(
        new ForbiddenException({
          message: 'Ticket is already claimed by another staff member',
          code: 'ASSIGNMENT_NOT_PERMITTED',
        })
      );

      await expect(
        controller.assignTicket(admin, ticketId, { assigneeId: admin.userId }) // Trying to self-claim, but it's already claimed
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
