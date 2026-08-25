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
  BadRequestException,
} from '@nestjs/common';
import { eq, desc, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class KycService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

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
    const certFile = files.certOfRegistration?.[0];
    const utilityFile = files.utilityBill?.[0];
    const ownerIdFile = files.ownerId?.[0];

    // Document 1 (certOfRegistration) MUST be a PDF — images are not accepted
    if (certFile && certFile.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'Certificate of Registration / Incorporation must be a PDF file. JPG, JPEG, PNG and other image formats are not accepted for this document.',
      );
    }

    const certPath = certFile?.filename ?? undefined;
    const utilityPath = utilityFile?.filename ?? undefined;
    const ownerIdPath = ownerIdFile?.filename ?? undefined;

    // Check if there is an in-progress review
    const pending = await this.db.query.kyc.findFirst({
      where: and(
        eq(schema.kyc.userId, userId),
        eq(schema.kyc.status, 'pending'),
      ),
    });
    if (pending) {
      throw new BadRequestException('You already have a verification submission pending review.');
    }

    // Find if there is a previously approved profile
    const previouslyApproved = await this.db.query.kyc.findFirst({
      where: and(
        eq(schema.kyc.userId, userId),
        eq(schema.kyc.status, 'approved'),
      ),
      orderBy: [desc(schema.kyc.submittedAt)],
    });

    // Find the most recent submission (of any status) to reuse documents
    const latest = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
      orderBy: [desc(schema.kyc.submittedAt)],
    });

    const cert = certPath || latest?.certOfRegistrationPath || null;
    const utility = utilityPath || latest?.utilityBillPath || null;
    const ownerId = ownerIdPath || latest?.ownerIdPath || null;

    const isUpdate = !!previouslyApproved;
    const now = new Date();

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
        
        certOfRegistrationPath: cert,
        certOfRegistrationOriginalName: certFile?.originalname || latest?.certOfRegistrationOriginalName || null,
        certOfRegistrationMimeType: certFile?.mimetype || latest?.certOfRegistrationMimeType || null,
        certOfRegistrationFileSize: certFile?.size || latest?.certOfRegistrationFileSize || null,
        certOfRegistrationUploadedAt: certFile ? now : (latest?.certOfRegistrationUploadedAt || null),

        utilityBillPath: utility,
        utilityBillOriginalName: utilityFile?.originalname || latest?.utilityBillOriginalName || null,
        utilityBillMimeType: utilityFile?.mimetype || latest?.utilityBillMimeType || null,
        utilityBillFileSize: utilityFile?.size || latest?.utilityBillFileSize || null,
        utilityBillUploadedAt: utilityFile ? now : (latest?.utilityBillUploadedAt || null),

        ownerIdPath: ownerId,
        ownerIdOriginalName: ownerIdFile?.originalname || latest?.ownerIdOriginalName || null,
        ownerIdMimeType: ownerIdFile?.mimetype || latest?.ownerIdMimeType || null,
        ownerIdFileSize: ownerIdFile?.size || latest?.ownerIdFileSize || null,
        ownerIdUploadedAt: ownerIdFile ? now : (latest?.ownerIdUploadedAt || null),

        status: 'pending',
        isUpdateRequest: isUpdate,
        parentId: previouslyApproved?.id ?? null,
        submittedAt: now,
      })
      .returning();

    // Update businessName, country, phoneNumber in users table
    await this.db
      .update(schema.users)
      .set({
        businessName: dto.businessName,
        country: dto.country,
        phoneNumber: dto.businessPhone,
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId));

    // Log submission to activity audit logs
    await this.activityLogsService.record({
      userId,
      userName: null,
      action: isUpdate ? 'KYC_UPDATE_REQUEST' : 'KYC_SUBMITTED',
      module: 'user_management',
      description: isUpdate 
        ? `Submitted KYC update request for business: ${dto.businessName}`
        : `Submitted initial KYC verification for business: ${dto.businessName}`,
    });

    return created;
  }

  /**
   * Return the current KYC record for the authenticated user (or null if none).
   * Used by the frontend to decide which state to render on the Channels page.
   */
  async getMyKyc(userId: string) {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
      orderBy: [desc(schema.kyc.submittedAt)],
    });
    return record ?? null;
  }

  /**
   * Lightweight status check used by the social-accounts service to gate
   * channel connections without returning the full sensitive record.
   *
   * Returns the status string ('pending' | 'approved' | 'rejected' | 'resubmission_required') or null
   * when no KYC has been submitted yet.
   */
  async getKycStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | 'resubmission_required' | null> {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
      columns: { status: true },
      orderBy: [desc(schema.kyc.submittedAt)],
    });
    return (record?.status as any) ?? null;
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
   * Admin approves, rejects, or requests resubmission for a KYC submission.
   *
   * @param kycId    The KYC record UUID
   * @param adminId  The reviewing admin's user UUID (stored for audit trail)
   * @param dto      { status: 'approved' | 'rejected' | 'resubmission_required', rejectionReason? }
   */
  async adminReview(kycId: string, adminId: string, dto: ReviewKycDto) {
    // Confirm the record exists before attempting update
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.id, kycId),
    });
    if (!record) throw new NotFoundException('KYC record not found');

    const statusVal = dto.status as any;
    const updatePayload: any = {
      status: statusVal,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason:
        (dto.status === 'approved' || dto.status === 'pending') ? null : (dto.rejectionReason ?? null),
      updatedAt: new Date(),
    };

    if (dto.status === 'pending') {
      updatePayload.certOfRegistrationStatus = 'pending';
      updatePayload.certOfRegistrationRejectionReason = null;
      updatePayload.utilityBillStatus = 'pending';
      updatePayload.utilityBillRejectionReason = null;
      updatePayload.ownerIdStatus = 'pending';
      updatePayload.ownerIdRejectionReason = null;
    } else if (dto.status === 'approved') {
      updatePayload.certOfRegistrationStatus = 'approved';
      updatePayload.certOfRegistrationRejectionReason = null;
      updatePayload.utilityBillStatus = 'approved';
      updatePayload.utilityBillRejectionReason = null;
      updatePayload.ownerIdStatus = 'approved';
      updatePayload.ownerIdRejectionReason = null;
    }

    const [updated] = await this.db
      .update(schema.kyc)
      .set(updatePayload)
      .where(eq(schema.kyc.id, kycId))
      .returning();

    // Log the review action
    await this.activityLogsService.record({
      userId: adminId,
      action: dto.status === 'approved' 
        ? 'KYC_APPROVED' 
        : dto.status === 'rejected' 
          ? 'KYC_REJECTED' 
          : 'KYC_RESUBMISSION_REQUESTED',
      module: 'user_management',
      description: dto.status === 'approved'
        ? `Approved KYC verification for user ${record.userId}`
        : `Requested KYC change/resubmission for user ${record.userId}. Reason: ${dto.rejectionReason}`,
    });

    // If approved, snapshot the fields to customer_company_profile
    if (dto.status === 'approved') {
      const existingProfile = await this.db.query.customerCompanyProfile.findFirst({
        where: eq(schema.customerCompanyProfile.userId, record.userId),
      });

      if (existingProfile) {
        await this.db
          .update(schema.customerCompanyProfile)
          .set({
            businessName: record.businessName,
            businessDescription: record.businessDescription,
            contactEmail: record.businessEmail,
            contactPhone: record.businessPhone,
            addressLine1: record.businessAddress,
            country: record.country,
            updatedAt: new Date(),
          })
          .where(eq(schema.customerCompanyProfile.id, existingProfile.id));
      } else {
        await this.db
          .insert(schema.customerCompanyProfile)
          .values({
            userId: record.userId,
            businessName: record.businessName,
            businessDescription: record.businessDescription,
            contactEmail: record.businessEmail,
            contactPhone: record.businessPhone,
            addressLine1: record.businessAddress,
            country: record.country,
            industry: 'Technology & SaaS', // Default placeholder
          });
      }

      // Also update the businessName in the users table
      await this.db
        .update(schema.users)
        .set({
          businessName: record.businessName,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, record.userId));
    }

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

  async rejectDocument(
    kycId: string,
    docType: 'cert' | 'utility' | 'ownerId',
    adminId: string,
    reason?: string,
    documentName?: string,
  ) {
    const record = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.id, kycId),
    });
    if (!record) throw new NotFoundException('KYC record not found');

    const docLabel = documentName || (docType === 'cert' ? 'Registration Cert' : docType === 'utility' ? 'Proof of Address' : 'Owner ID');
    let finalReason = reason;
    if (!finalReason || !finalReason.trim()) {
      finalReason = `This KYC was rejected because the submitted ${docLabel} did not meet the verification requirements.`;
    }

    const updateFields: any = {};
    if (docType === 'cert') {
      updateFields.certOfRegistrationStatus = 'rejected';
      updateFields.certOfRegistrationRejectionReason = finalReason;
    } else if (docType === 'utility') {
      updateFields.utilityBillStatus = 'rejected';
      updateFields.utilityBillRejectionReason = finalReason;
    } else if (docType === 'ownerId') {
      updateFields.ownerIdStatus = 'rejected';
      updateFields.ownerIdRejectionReason = finalReason;
    } else {
      throw new BadRequestException('Invalid document type');
    }

    // Set overall status to rejected
    updateFields.status = 'rejected';
    updateFields.reviewedBy = adminId;
    updateFields.reviewedAt = new Date();
    updateFields.rejectionReason = `Document verification failed: ${docLabel} was rejected. Reason: ${finalReason}`;
    updateFields.updatedAt = new Date();

    const [updated] = await this.db
      .update(schema.kyc)
      .set(updateFields)
      .where(eq(schema.kyc.id, kycId))
      .returning();

    // Log the rejection
    await this.activityLogsService.record({
      userId: adminId,
      action: 'KYC_DOCUMENT_REJECTED',
      module: 'user_management',
      description: `Rejected document ${docType} for KYC record ${kycId}. Reason: ${finalReason}`,
    });

    return updated;
  }
}
