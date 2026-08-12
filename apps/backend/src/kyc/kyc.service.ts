/**
 * kyc.service.ts
 * ---------------------------------------------------------------------------
 * Business logic for KYC submissions and admin review.
 *
 * Key design decisions:
 *  - One KYC record per user — repeated submissions UPSERT the existing row
 *    (so re-submissions after rejection overwrite the old data and reset
 *    status to 'pending').
 *  - Document files are stored on disk via the existing MulterModule pattern
 *    used by uploads.module.ts. The stored filename is persisted in the kyc
 *    row so it can be streamed to admins.
 *  - The service exposes a `getKycStatus(userId)` helper consumed by the
 *    social-accounts service to gate channel connections.
 * ---------------------------------------------------------------------------
 */
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class KycService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  // ---------------------------------------------------------------------------
  // USER-FACING METHODS
  // ---------------------------------------------------------------------------

  /**
   * Submit or re-submit KYC.
   *
   * Behaviour:
   *  - If no row exists → INSERT with status = 'pending'.
   *  - If a row exists (even if previously rejected) → UPDATE all fields and
   *    reset status to 'pending' so the admin reviews the corrected info.
   *  - Document paths are stored only when a file is provided; existing paths
   *    are preserved when a new file is not uploaded for that slot.
   */
  async submitKyc(
    userId: string,
    dto: SubmitKycDto,
    files: {
      certOfRegistration?: Express.Multer.File[];
      utilityBill?: Express.Multer.File[];
      ownerId?: Express.Multer.File[];
    },
  ) {
    // Extract the stored filename for each document (if uploaded this time)
    const certPath = files.certOfRegistration?.[0]?.filename ?? undefined;
    const utilityPath = files.utilityBill?.[0]?.filename ?? undefined;
    const ownerIdPath = files.ownerId?.[0]?.filename ?? undefined;

    // Check if a KYC record already exists for this user
    const existing = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
    });

    if (existing) {
      // --- RE-SUBMISSION: update all text fields, reset status to pending ---
      // Only overwrite document paths when a new file was uploaded for that slot
      const [updated] = await this.db
        .update(schema.kyc)
        .set({
          businessName: dto.businessName,
          registrationNumber: dto.registrationNumber ?? null,
          businessType: dto.businessType,
          businessAddress: dto.businessAddress,
          country: dto.country,
          businessEmail: dto.businessEmail,
          businessPhone: dto.businessPhone,
          businessDescription: dto.businessDescription,
          // Preserve old paths when no new file was uploaded for that slot
          ...(certPath && { certOfRegistrationPath: certPath }),
          ...(utilityPath && { utilityBillPath: utilityPath }),
          ...(ownerIdPath && { ownerIdPath }),
          // Reset review state so admins see fresh data
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.kyc.userId, userId))
        .returning();
      return updated;
    }

    // --- FIRST SUBMISSION ---
    const [created] = await this.db
      .insert(schema.kyc)
      .values({
        userId,
        businessName: dto.businessName,
        registrationNumber: dto.registrationNumber ?? null,
        businessType: dto.businessType,
        businessAddress: dto.businessAddress,
        country: dto.country,
        businessEmail: dto.businessEmail,
        businessPhone: dto.businessPhone,
        businessDescription: dto.businessDescription,
        certOfRegistrationPath: certPath ?? null,
        utilityBillPath: utilityPath ?? null,
        ownerIdPath: ownerIdPath ?? null,
        status: 'pending',
      })
      .returning();
    return created;
  }

  /**
   * Return the current KYC record for the authenticated user (or null if none).
   * Used by the frontend to decide which state to render on the Channels page.
   */
  async getMyKyc(userId: string) {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
    });
    return record ?? null;
  }

  /**
   * Lightweight status check used by the social-accounts service to gate
   * channel connections without returning the full sensitive record.
   *
   * Returns the status string ('pending' | 'approved' | 'rejected') or null
   * when no KYC has been submitted yet.
   */
  async getKycStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
      columns: { status: true },
    });
    return record?.status ?? null;
  }

  // ---------------------------------------------------------------------------
  // ADMIN-FACING METHODS
  // ---------------------------------------------------------------------------

  /**
   * Returns all KYC submissions ordered by most recent submission first.
   * Joins the user table so the admin sees name/email alongside the record.
   */
  async adminGetAll() {
    return this.db.query.kyc.findMany({
      orderBy: [desc(schema.kyc.submittedAt)],
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Returns a single KYC record by its ID.
   * Used by the admin detail / review page.
   */
  async adminGetOne(kycId: string) {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.id, kycId),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            businessName: true,
          },
        },
      },
    });
    if (!record) throw new NotFoundException('KYC record not found');
    return record;
  }

  /**
   * Admin approves or rejects a KYC submission.
   *
   * @param kycId    The KYC record UUID
   * @param adminId  The reviewing admin's user UUID (stored for audit trail)
   * @param dto      { status: 'approved' | 'rejected', rejectionReason? }
   */
  async adminReview(kycId: string, adminId: string, dto: ReviewKycDto) {
    // Confirm the record exists before attempting update
    const existing = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.id, kycId),
      columns: { id: true },
    });
    if (!existing) throw new NotFoundException('KYC record not found');

    const [updated] = await this.db
      .update(schema.kyc)
      .set({
        status: dto.status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        // Clear stale rejection reason when approving
        rejectionReason:
          dto.status === 'rejected' ? (dto.rejectionReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.kyc.id, kycId))
      .returning();
    return updated;
  }

  /**
   * Returns the stored filename for a given document slot on a KYC record.
   * The controller streams the file from disk using this filename.
   *
   * @param kycId   KYC record UUID
   * @param docType One of 'cert' | 'utility' | 'ownerId'
   */
  async getDocumentPath(
    kycId: string,
    docType: 'cert' | 'utility' | 'ownerId',
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<string> {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.id, kycId),
    });
    if (!record) throw new NotFoundException('KYC record not found');

    // Security: non-admins can only access their own documents
    if (!isAdmin && record.userId !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    const pathMap: Record<string, string | null | undefined> = {
      cert: record.certOfRegistrationPath,
      utility: record.utilityBillPath,
      ownerId: record.ownerIdPath,
    };

    const filePath = pathMap[docType];
    if (!filePath) throw new NotFoundException('Document not found for this KYC record');
    return filePath;
  }
}
