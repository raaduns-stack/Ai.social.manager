import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DesignManagementService {
  private readonly logger = new Logger(DesignManagementService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ===========================================================================
  // TASKS MANAGEMENT
  // ===========================================================================

  async listTasks(query: { designerId?: string; status?: string; priority?: string }) {
    const conditions = [];

    if (query.designerId) {
      conditions.push(eq(schema.tasks.assignedTo, query.designerId));
    }
    if (query.status && ['open', 'in_progress', 'done'].includes(query.status)) {
      conditions.push(eq(schema.tasks.status, query.status as any));
    }
    if (query.priority && ['low', 'medium', 'high'].includes(query.priority)) {
      conditions.push(eq(schema.tasks.priority, query.priority as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tasksList = await this.db.query.tasks.findMany({
      where: whereClause,
      with: {
        assignee: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        assigner: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [desc(schema.tasks.createdAt)],
    });

    return tasksList;
  }

  async createTask(dto: CreateTaskDto, adminId?: string) {
    // Validate assigned designer
    const designer = await this.db.query.users.findFirst({
      where: and(eq(schema.users.id, dto.assignedTo), eq(schema.users.role, 'designer')),
    });
    if (!designer) {
      throw new BadRequestException('Assigned user must be an active graphic designer.');
    }

    const [created] = await this.db
      .insert(schema.tasks)
      .values({
        title: dto.title,
        brief: dto.brief || null,
        priority: dto.priority || 'medium',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: 'open',
        assignedTo: dto.assignedTo,
        assignedBy: adminId || null,
      })
      .returning();

    // Trigger notification
    try {
      await this.notificationsService.triggerTaskEvent({
        taskId: created.id,
        designerId: created.assignedTo,
        taskTitle: created.title,
        eventType: 'assigned',
        senderId: adminId,
        details: created.brief || undefined,
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch task assignment notification: ${err.message}`);
    }

    return created;
  }

  async updateTask(id: string, dto: UpdateTaskDto, adminId?: string) {
    const existing = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Task not found.');
    }

    if (dto.assignedTo && dto.assignedTo !== existing.assignedTo) {
      const designer = await this.db.query.users.findFirst({
        where: and(eq(schema.users.id, dto.assignedTo), eq(schema.users.role, 'designer')),
      });
      if (!designer) {
        throw new BadRequestException('Assigned user must be an active graphic designer.');
      }
    }

    const updatePayload: any = {
      updatedAt: new Date(),
    };
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.brief !== undefined) updatePayload.brief = dto.brief;
    if (dto.priority !== undefined) updatePayload.priority = dto.priority;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.dueDate !== undefined)
      updatePayload.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.assignedTo !== undefined) updatePayload.assignedTo = dto.assignedTo;

    const [updated] = await this.db
      .update(schema.tasks)
      .set(updatePayload)
      .where(eq(schema.tasks.id, id))
      .returning();

    if (dto.status && dto.status !== existing.status) {
      try {
        await this.notificationsService.triggerTaskEvent({
          taskId: updated.id,
          designerId: updated.assignedTo,
          taskTitle: updated.title,
          eventType: dto.status === 'done' ? 'completed' : 'updated',
          senderId: adminId,
          details: `Task status updated to ${dto.status}`,
        });
      } catch (err) {
        this.logger.warn(`Failed to dispatch task update notification: ${err.message}`);
      }
    }

    return updated;
  }

  async deleteTask(id: string) {
    const existing = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Task not found.');
    }

    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return { success: true, message: 'Task deleted successfully.' };
  }

  // ===========================================================================
  // SUBMISSIONS MANAGEMENT & REVIEW
  // ===========================================================================

  async listSubmissions(query: { designerId?: string; status?: string; category?: string }) {
    const conditions = [];

    if (query.designerId) {
      conditions.push(eq(schema.submissions.designerId, query.designerId));
    }
    if (query.status) {
      conditions.push(eq(schema.submissions.status, query.status as any));
    }
    if (query.category) {
      conditions.push(eq(schema.submissions.category, query.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db.query.submissions.findMany({
      where: whereClause,
      with: {
        designer: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        task: {
          columns: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        files: true,
        activities: {
          orderBy: [desc(schema.submissionActivities.createdAt)],
          limit: 5,
        },
      },
      orderBy: [desc(schema.submissions.createdAt)],
    });

    return items;
  }

  async getSubmissionDetail(id: string) {
    const submission = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, id),
      with: {
        designer: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        task: true,
        files: true,
        activities: {
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: [desc(schema.submissionActivities.createdAt)],
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    return submission;
  }

  async reviewSubmission(id: string, dto: ReviewSubmissionDto, adminId?: string) {
    const submission = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, id),
    });
    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    // Update submission status
    const [updated] = await this.db
      .update(schema.submissions)
      .set({
        status: dto.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.submissions.id, id))
      .returning();

    // Insert activity log
    const activityTitle =
      dto.status === 'approved'
        ? `Submission approved${dto.notes ? `: ${dto.notes}` : ''}`
        : dto.status === 'revision_required'
          ? `Revision requested: ${dto.notes || 'Please make adjustments'}`
          : `Status set to ${dto.status}${dto.notes ? `: ${dto.notes}` : ''}`;

    await this.db.insert(schema.submissionActivities).values({
      submissionId: id,
      type: dto.status,
      title: activityTitle,
      userId: adminId || null,
    });

    // If approved and linked to a task, mark task as done
    if (dto.status === 'approved' && submission.taskId) {
      await this.db
        .update(schema.tasks)
        .set({
          status: 'done',
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, submission.taskId));
    }

    // Trigger notification to designer
    try {
      let notifEventType: 'submitted' | 'reviewed' | 'revision_required' | 'rejected' | 'approved' =
        'reviewed';
      if (dto.status === 'approved') notifEventType = 'approved';
      else if (dto.status === 'revision_required') notifEventType = 'revision_required';

      await this.notificationsService.triggerSubmissionEvent({
        submissionId: id,
        designerId: submission.designerId,
        title: submission.title,
        eventType: notifEventType,
        senderId: adminId,
        notes: dto.notes,
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch submission review notification: ${err.message}`);
    }

    return this.getSubmissionDetail(id);
  }
}
