/**
 * graphics.service.ts
 * ---------------------------------------------------------------------------
 * Admin-side graphics workspace (FeatureList GRAPHICS §3/§4/§5).
 *
 * Unlike DesignerService (single-designer scoped, `@Roles(designer)`), every
 * query here is unscoped: admins list, create, assign, review and delete
 * across all designers. Callers are gated by PermissionsGuard +
 * `@RequirePermission('graphics_management', ...)` in the controller.
 *
 * No new tables: the task timeline is derived from tasks + linked
 * submissions + submission_activities, and conversion reviews write the
 * existing `image_to_code.reviewer_note` column.
 * ---------------------------------------------------------------------------
 */
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, sql, inArray, ilike, or, SQL } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CreateGraphicsTaskDto } from './dto/create-task.dto';
import { UpdateGraphicsTaskDto } from './dto/update-task.dto';
import { ReviewGraphicsSubmissionDto } from './dto/review-submission.dto';
import { ReviewGraphicsConversionDto } from './dto/review-conversion.dto';

type Database = PostgresJsDatabase<typeof schema>;

const SUBMISSION_TRANSITIONS: Record<string, string[]> = {
  submitted: ['received', 'under_review', 'revision_required', 'approved'],
  received: ['under_review', 'revision_required', 'approved'],
  under_review: ['revision_required', 'approved'],
  resubmitted: ['received', 'under_review', 'revision_required', 'approved'],
  approved: ['completed'],
  // draft: designer has not submitted anything yet — nothing to review.
  // revision_required / completed: locked until the designer acts.
};

const SUBMISSION_REVIEW_LABELS: Record<string, string> = {
  received: 'Marked received',
  under_review: 'Marked under review',
  revision_required: 'Revision requested',
  approved: 'Approved',
  completed: 'Marked completed',
};

@Injectable()
export class AdminGraphicsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  // -------------------------------------------------------------------------
  // DESIGNERS (assign dropdown)
  // -------------------------------------------------------------------------

  async listDesigners() {
    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.fullName,
        email: schema.users.email,
        isActive: schema.users.isActive,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'designer' as any))
      .orderBy(schema.users.fullName);
  }

  private async requireDesigner(designerId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) throw new NotFoundException('Designer not found');
    if (user.role !== ('designer' as any)) {
      throw new BadRequestException('Tasks can only be assigned to designer accounts');
    }
    return user;
  }

  private async notifyDesigner(designerId: string, type: string, title: string, message?: string) {
    await this.db.insert(schema.designerNotifications).values({
      designerId,
      type: type as any,
      title,
      message,
    });
  }

  // -------------------------------------------------------------------------
  // TASKS (§3)
  // -------------------------------------------------------------------------

  async listTasks(filters: {
    status?: string;
    priority?: string;
    designerId?: string;
    search?: string;
  }) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(schema.tasks.status, filters.status as any));
    if (filters.priority) conditions.push(eq(schema.tasks.priority, filters.priority as any));
    if (filters.designerId) conditions.push(eq(schema.tasks.assignedTo, filters.designerId));
    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(or(ilike(schema.tasks.title, q), ilike(schema.tasks.brief, q)) as SQL);
    }

    const rows = await this.db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        brief: schema.tasks.brief,
        priority: schema.tasks.priority,
        status: schema.tasks.status,
        dueDate: schema.tasks.dueDate,
        designerId: schema.tasks.assignedTo,
        designerName: schema.users.fullName,
        createdAt: schema.tasks.createdAt,
        updatedAt: schema.tasks.updatedAt,
      })
      .from(schema.tasks)
      .leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.tasks.createdAt));

    if (rows.length === 0) return [];

    const submissionCounts = await this.db
      .select({
        taskId: schema.submissions.taskId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.submissions)
      .where(
        inArray(
          schema.submissions.taskId,
          rows.map((r) => r.id),
        ),
      )
      .groupBy(schema.submissions.taskId);

    const countMap = new Map(submissionCounts.map((c) => [c.taskId, c.count]));

    return rows.map((r) => ({
      ...r,
      submissions: countMap.get(r.id) ?? 0,
    }));
  }

  async getTaskById(taskId: string) {
    const rows = await this.db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        brief: schema.tasks.brief,
        priority: schema.tasks.priority,
        status: schema.tasks.status,
        dueDate: schema.tasks.dueDate,
        designerId: schema.tasks.assignedTo,
        designerName: schema.users.fullName,
        designerEmail: schema.users.email,
        createdAt: schema.tasks.createdAt,
        updatedAt: schema.tasks.updatedAt,
      })
      .from(schema.tasks)
      .leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id))
      .where(eq(schema.tasks.id, taskId));

    const task = rows[0];
    if (!task) throw new NotFoundException('Task not found');

    const linkedSubmissions = await this.db
      .select({
        id: schema.submissions.id,
        title: schema.submissions.title,
        status: schema.submissions.status,
        updatedAt: schema.submissions.updatedAt,
      })
      .from(schema.submissions)
      .where(eq(schema.submissions.taskId, taskId))
      .orderBy(desc(schema.submissions.updatedAt));

    let submissionActivities: {
      at: Date | null;
      text: string;
    }[] = [];
    if (linkedSubmissions.length > 0) {
      const acts = await this.db
        .select()
        .from(schema.submissionActivities)
        .where(
          inArray(
            schema.submissionActivities.submissionId,
            linkedSubmissions.map((s) => s.id),
          ),
        )
        .orderBy(desc(schema.submissionActivities.createdAt));
      submissionActivities = acts.map((a) => ({ at: a.createdAt, text: a.title }));
    }

    // Derived timeline (no task_activities table): task lifecycle events +
    // every activity recorded on linked submissions, newest first.
    const timeline = [
      { at: task.updatedAt, text: `Status: ${task.status}` },
      ...submissionActivities,
      { at: task.createdAt, text: 'Task created' },
    ].sort((a, b) => {
      const at = a.at ? new Date(a.at).getTime() : 0;
      const bt = b.at ? new Date(b.at).getTime() : 0;
      return bt - at;
    });

    return {
      ...task,
      submissions: linkedSubmissions,
      timeline,
    };
  }

  async createTask(adminId: string, dto: CreateGraphicsTaskDto) {
    await this.requireDesigner(dto.designerId);

    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        title: dto.title,
        brief: dto.brief,
        priority: (dto.priority ?? 'medium') as any,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedTo: dto.designerId,
        assignedBy: adminId,
        status: 'open' as any,
      })
      .returning();

    await this.notifyDesigner(
      dto.designerId,
      'task',
      `New task assigned: ${task.title}`,
      dto.brief ?? undefined,
    );

    return task;
  }

  async updateTask(adminId: string, taskId: string, dto: UpdateGraphicsTaskDto) {
    const existing = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });
    if (!existing) throw new NotFoundException('Task not found');

    if (dto.designerId && dto.designerId !== existing.assignedTo) {
      await this.requireDesigner(dto.designerId);
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.brief !== undefined) patch.brief = dto.brief;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.designerId !== undefined) patch.assignedTo = dto.designerId;
    void adminId;

    const [updated] = await this.db
      .update(schema.tasks)
      .set(patch as any)
      .where(eq(schema.tasks.id, taskId))
      .returning();

    const reassigned = dto.designerId && dto.designerId !== existing.assignedTo;
    if (reassigned) {
      await this.notifyDesigner(
        dto.designerId as string,
        'task',
        `Task reassigned to you: ${updated.title}`,
      );
    } else if (dto.status && dto.status !== existing.status) {
      await this.notifyDesigner(
        updated.assignedTo,
        'task',
        `Task update: ${updated.title} is now ${dto.status}`,
      );
    }

    return updated;
  }

  async deleteTask(taskId: string) {
    const existing = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });
    if (!existing) throw new NotFoundException('Task not found');

    // Linked submissions are preserved; their task_id FK is SET NULL.
    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, taskId));
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // SUBMISSIONS (§4)
  // -------------------------------------------------------------------------

  async listSubmissions(filters: {
    status?: string;
    category?: string;
    designerId?: string;
    search?: string;
  }) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(schema.submissions.status, filters.status as any));
    if (filters.category) conditions.push(eq(schema.submissions.category, filters.category));
    if (filters.designerId) conditions.push(eq(schema.submissions.designerId, filters.designerId));
    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(
        or(ilike(schema.submissions.title, q), ilike(schema.submissions.description, q)) as SQL,
      );
    }

    const rows = await this.db
      .select({
        id: schema.submissions.id,
        title: schema.submissions.title,
        category: schema.submissions.category,
        status: schema.submissions.status,
        description: schema.submissions.description,
        designerId: schema.submissions.designerId,
        designer: schema.users.fullName,
        taskId: schema.submissions.taskId,
        task: schema.tasks.title,
        createdAt: schema.submissions.createdAt,
        updatedAt: schema.submissions.updatedAt,
      })
      .from(schema.submissions)
      .leftJoin(schema.users, eq(schema.submissions.designerId, schema.users.id))
      .leftJoin(schema.tasks, eq(schema.submissions.taskId, schema.tasks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.submissions.updatedAt));

    if (rows.length === 0) return [];

    const fileCounts = await this.db
      .select({
        submissionId: schema.submissionFiles.submissionId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.submissionFiles)
      .where(
        inArray(
          schema.submissionFiles.submissionId,
          rows.map((r) => r.id),
        ),
      )
      .groupBy(schema.submissionFiles.submissionId);

    const fileCountMap = new Map(fileCounts.map((f) => [f.submissionId, f.count]));

    return rows.map((r) => ({
      ...r,
      files: fileCountMap.get(r.id) ?? 0,
    }));
  }

  async getSubmissionById(submissionId: string) {
    const rows = await this.db
      .select({
        id: schema.submissions.id,
        title: schema.submissions.title,
        category: schema.submissions.category,
        status: schema.submissions.status,
        description: schema.submissions.description,
        designerId: schema.submissions.designerId,
        designer: schema.users.fullName,
        designerEmail: schema.users.email,
        taskId: schema.submissions.taskId,
        task: schema.tasks.title,
        taskStatus: schema.tasks.status,
        createdAt: schema.submissions.createdAt,
        updatedAt: schema.submissions.updatedAt,
      })
      .from(schema.submissions)
      .leftJoin(schema.users, eq(schema.submissions.designerId, schema.users.id))
      .leftJoin(schema.tasks, eq(schema.submissions.taskId, schema.tasks.id))
      .where(eq(schema.submissions.id, submissionId));

    const submission = rows[0];
    if (!submission) throw new NotFoundException('Submission not found');

    const files = await this.db
      .select()
      .from(schema.submissionFiles)
      .where(eq(schema.submissionFiles.submissionId, submissionId));

    const history = await this.db
      .select()
      .from(schema.submissionActivities)
      .where(eq(schema.submissionActivities.submissionId, submissionId))
      .orderBy(desc(schema.submissionActivities.createdAt));

    return { ...submission, files, history };
  }

  async reviewSubmission(adminId: string, submissionId: string, dto: ReviewGraphicsSubmissionDto) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');

    const allowed = SUBMISSION_TRANSITIONS[sub.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot move a ${sub.status} submission to ${dto.status}`);
    }

    const [updated] = await this.db
      .update(schema.submissions)
      .set({ status: dto.status as any, updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId))
      .returning();

    const label = SUBMISSION_REVIEW_LABELS[dto.status] ?? dto.status;
    await this.db.insert(schema.submissionActivities).values({
      submissionId,
      type: 'review',
      title: dto.note?.trim() ? `${label}: “${dto.note.trim()}”` : label,
      userId: adminId,
    });

    const notificationType =
      dto.status === 'revision_required'
        ? 'revision'
        : dto.status === 'approved' || dto.status === 'completed'
          ? 'approved'
          : 'system';
    await this.notifyDesigner(
      sub.designerId,
      notificationType,
      `${label}: ${sub.title}`,
      dto.note?.trim() || undefined,
    );

    // Approving a design mints its image-to-code request row (idempotent —
    // one conversion per submission). Without this the conversion queue
    // stays empty because nothing else inserts into `image_to_code`.
    if (dto.status === 'approved') {
      await this.ensureConversion(sub.designerId, submissionId);
    }

    return updated;
  }

  // -------------------------------------------------------------------------
  // IMAGE-TO-CODE (§5)
  // -------------------------------------------------------------------------

  /**
   * Mint the one-row-per-submission conversion request. Idempotent:
   * concurrent approvals / manual requests for the same design collapse
   * onto the existing row via the submission_id unique constraint.
   */
  private async ensureConversion(designerId: string, submissionId: string) {
    const [row] = await this.db
      .insert(schema.imageToCode)
      .values({ designerId, submissionId, status: 'not_started' as any })
      .onConflictDoNothing({ target: schema.imageToCode.submissionId })
      .returning();
    if (row) return row;
    const existing = await this.db.query.imageToCode.findFirst({
      where: eq(schema.imageToCode.submissionId, submissionId),
    });
    if (!existing) throw new NotFoundException('Image-to-code conversion not found');
    return existing;
  }

  /**
   * Manually request a conversion for an approved/completed design
   * (FeatureList §5 "Image-to-Code Requests"). Returns the existing row
   * when one is already present.
   */
  async requestConversion(adminId: string, submissionId: string) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.status !== 'approved' && sub.status !== 'completed') {
      throw new BadRequestException(
        `Conversions can only be requested for approved designs (current status: ${sub.status})`,
      );
    }
    const conversion = await this.ensureConversion(sub.designerId, submissionId);
    await this.db.insert(schema.submissionActivities).values({
      submissionId,
      type: 'review',
      title: 'Code conversion requested',
      userId: adminId,
    });
    await this.notifyDesigner(
      sub.designerId,
      'task',
      `Code conversion requested: ${sub.title}`,
      'Open the design in Image-to-Code and submit your coded version.',
    );
    return conversion;
  }

  /**
   * One-shot repair: mint conversion rows for every approved/completed
   * submission that predates auto-creation on approval. Safe to re-run.
   */
  async backfillConversions() {
    const approved = await this.db
      .select({
        id: schema.submissions.id,
        designerId: schema.submissions.designerId,
      })
      .from(schema.submissions)
      .where(inArray(schema.submissions.status, ['approved', 'completed'] as any));

    let created = 0;
    for (const sub of approved) {
      const [row] = await this.db
        .insert(schema.imageToCode)
        .values({
          designerId: sub.designerId,
          submissionId: sub.id,
          status: 'not_started' as any,
        })
        .onConflictDoNothing({ target: schema.imageToCode.submissionId })
        .returning();
      if (row) created += 1;
    }
    return { created, checked: approved.length };
  }

  async listConversions(filters: { status?: string; search?: string }) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(schema.imageToCode.status, filters.status as any));
    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(
        or(ilike(schema.submissions.title, q), ilike(schema.imageToCode.techNotes, q)) as SQL,
      );
    }

    return this.db
      .select({
        id: schema.imageToCode.id,
        status: schema.imageToCode.status,
        reviewerNote: schema.imageToCode.reviewerNote,
        submittedAt: schema.imageToCode.submittedAt,
        updatedAt: schema.imageToCode.updatedAt,
        submissionId: schema.imageToCode.submissionId,
        submission: schema.submissions.title,
        submissionCategory: schema.submissions.category,
        designerId: schema.imageToCode.designerId,
        designer: schema.users.fullName,
      })
      .from(schema.imageToCode)
      .innerJoin(schema.submissions, eq(schema.imageToCode.submissionId, schema.submissions.id))
      .leftJoin(schema.users, eq(schema.imageToCode.designerId, schema.users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.imageToCode.updatedAt));
  }

  async getConversionById(conversionId: string) {
    const rows = await this.db
      .select({
        id: schema.imageToCode.id,
        status: schema.imageToCode.status,
        code: schema.imageToCode.code,
        techNotes: schema.imageToCode.techNotes,
        reviewerNote: schema.imageToCode.reviewerNote,
        submittedAt: schema.imageToCode.submittedAt,
        updatedAt: schema.imageToCode.updatedAt,
        submissionId: schema.imageToCode.submissionId,
        submission: schema.submissions.title,
        submissionCategory: schema.submissions.category,
        submissionStatus: schema.submissions.status,
        designerId: schema.imageToCode.designerId,
        designer: schema.users.fullName,
        designerEmail: schema.users.email,
      })
      .from(schema.imageToCode)
      .innerJoin(schema.submissions, eq(schema.imageToCode.submissionId, schema.submissions.id))
      .leftJoin(schema.users, eq(schema.imageToCode.designerId, schema.users.id))
      .where(eq(schema.imageToCode.id, conversionId));

    const conversion = rows[0];
    if (!conversion) throw new NotFoundException('Image-to-code conversion not found');

    const files = await this.db
      .select()
      .from(schema.submissionFiles)
      .where(eq(schema.submissionFiles.submissionId, conversion.submissionId));

    const history = await this.db
      .select()
      .from(schema.submissionActivities)
      .where(eq(schema.submissionActivities.submissionId, conversion.submissionId))
      .orderBy(desc(schema.submissionActivities.createdAt));

    return { ...conversion, files, history };
  }

  async reviewConversion(adminId: string, conversionId: string, dto: ReviewGraphicsConversionDto) {
    const conv = await this.db.query.imageToCode.findFirst({
      where: eq(schema.imageToCode.id, conversionId),
    });
    if (!conv) throw new NotFoundException('Image-to-code conversion not found');

    // Only submitted work can be reviewed; revisions come back via the
    // designer's draft → submit flow, accepted rows are terminal.
    if (conv.status !== 'submitted') {
      throw new BadRequestException(
        `Cannot review a ${conv.status} conversion — only submitted conversions can be reviewed`,
      );
    }

    const [updated] = await this.db
      .update(schema.imageToCode)
      .set({
        status: dto.status as any,
        reviewerNote: dto.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.imageToCode.id, conversionId))
      .returning();

    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, conv.submissionId),
    });

    const label =
      dto.status === 'accepted' ? 'Conversion accepted' : 'Conversion revision requested';
    await this.db.insert(schema.submissionActivities).values({
      submissionId: conv.submissionId,
      type: 'review',
      title: dto.note?.trim() ? `${label}: “${dto.note.trim()}”` : label,
      userId: adminId,
    });

    await this.notifyDesigner(
      conv.designerId,
      dto.status === 'accepted' ? 'approved' : 'revision',
      `${label}: ${sub?.title ?? 'design'}`,
      dto.note?.trim() || undefined,
    );

    return updated;
  }
}
