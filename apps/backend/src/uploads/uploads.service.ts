import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, ilike } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { QueryUploadDto } from './dto/query-upload.dto';
import { QueryAdminUploadDto } from './dto/query-admin-upload.dto';
import { ReviewUploadDto } from './dto/review-upload.dto';
import { Upload } from '../database/schema/uploads.schema';
import { UploadStatus } from '../common/enums/upload-status.enum';

type Database = PostgresJsDatabase<typeof schema>;

// Marks this class as a NestJS service
@Injectable()
export class UploadsService {
  // Inject the database connection
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) { }

  /**
   * Upload a file and save its metadata to the database.
   */
  async uploadFile(
    userId: string,
    file: any,
    createUploadDto: CreateUploadDto,
  ): Promise<Upload> {
    // Generate the file URL for accessing the uploaded file
    const fileUrl = `/uploads/${file.filename}`;

    // Save the upload information into the database
    const [upload] = await this.db
      .insert(schema.uploads)
      .values({
        userId,
        category: createUploadDto.category,
        originalName: file.originalname,
        storedName: file.filename,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        // Ensure status has a default value for new column
        status: UploadStatus.PENDING,
      })
      .returning();

    return upload;
  }

  /**
   * Retrieve all uploads belonging to the authenticated user.
   * Supports category filtering, filename search, sorting, and pagination.
   */
  async getMyUploads(userId: string, query: QueryUploadDto): Promise<Upload[]> {
    // Always return uploads that belong to the current user
    const conditions = [eq(schema.uploads.userId, userId)];

    // Filter uploads by category if provided
    if (query.category) {
      conditions.push(eq(schema.uploads.category, query.category));
    }

    // Search uploads by original filename
    if (query.search) {
      conditions.push(ilike(schema.uploads.originalName, `%${query.search}%`));
    }

    return this.db.query.uploads.findMany({
      where: and(...conditions),

      // Pagination
      limit: query.limit,
      offset: query.offset,

      // Sorting options
      orderBy: (uploads, { desc, asc }) => {
        // Sort by largest file size
        if (query.sortBy === 'Largest') {
          return [desc(uploads.fileSize)];
        }

        // Sort alphabetically by filename
        if (query.sortBy === 'Name') {
          return [asc(uploads.originalName)];
        }

        // Default: newest uploads first
        return [desc(uploads.createdAt)];
      },
    });
  }

  /**
   * Retrieve a single upload by its ID.
   * Ensures the upload belongs to the authenticated user.
   */
  async getUploadById(id: string, userId: string): Promise<Upload> {
    const upload = await this.db.query.uploads.findFirst({
      where: and(
        eq(schema.uploads.id, id),
        eq(schema.uploads.userId, userId),
      ),
    });

    // Throw an error if the upload doesn't exist
    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return upload;
  }

  /**
   * Update upload metadata (currently the upload category).
   */
  async updateUpload(
    id: string,
    userId: string,
    updateUploadDto: UpdateUploadDto,
  ): Promise<Upload> {
    const [updated] = await this.db
      .update(schema.uploads)
      .set({
        category: updateUploadDto.category,
        updatedAt: new Date(), // Record the update time
      })
      .where(
        and(
          eq(schema.uploads.id, id),
          eq(schema.uploads.userId, userId),
        ),
      )
      .returning();

    // Throw an error if the upload doesn't exist
    if (!updated) {
      throw new NotFoundException('Upload not found');
    }

    return updated;
  }

  /**
   * Delete an upload from both the database and local storage.
   */
  async deleteUpload(id: string, userId: string): Promise<void> {
    // Remove the upload record from the database
    const [deleted] = await this.db
      .delete(schema.uploads)
      .where(
        and(
          eq(schema.uploads.id, id),
          eq(schema.uploads.userId, userId),
        ),
      )
      .returning();

    // Throw an error if the upload doesn't exist
    if (!deleted) {
      throw new NotFoundException('Upload not found');
    }

    // Build the full path to the uploaded file
    const filePath = join(process.cwd(), 'uploads', deleted.storedName);

    // Remove the physical file from local storage if it exists
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (err) {
      // Log any file deletion errors without interrupting the request
      // eslint-disable-next-line no-console
      console.error(`Failed to delete local file: ${filePath}`, err);
    }
  }

  // =========================================================
  // ADMIN METHODS — moderation queue for customer uploads
  // =========================================================

  /**
   * ADMIN: Retrieve every customer upload (not scoped to one user) for the
   * moderation queue. Supports filtering by category, review status,
   * uploading customer, filename search, sorting, and pagination. Includes
   * basic uploader info via the existing `user` relation.
   */
  async getAllUploadsForAdmin(query: QueryAdminUploadDto) {
    const conditions = [];

    if (query.category) {
      conditions.push(eq(schema.uploads.category, query.category));
    }

    if (query.status) {
      conditions.push(eq(schema.uploads.status, query.status));
    }

    if (query.userId) {
      conditions.push(eq(schema.uploads.userId, query.userId));
    }

    if (query.search) {
      conditions.push(ilike(schema.uploads.originalName, `%${query.search}%`));
    }

    return this.db.query.uploads.findMany({
      where: conditions.length ? and(...conditions) : undefined,

      limit: query.limit,
      offset: query.offset,

      orderBy: (uploads, { desc, asc }) => {
        if (query.sortBy === 'Largest') {
          return [desc(uploads.fileSize)];
        }
        if (query.sortBy === 'Name') {
          return [asc(uploads.originalName)];
        }
        return [desc(uploads.createdAt)];
      },

      // Include the uploading customer's basic info for the moderation queue
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
  }

  /**
   * ADMIN: Retrieve a single upload by ID regardless of which customer owns
   * it, including the uploading customer's basic info.
   */
  async getUploadByIdForAdmin(id: string) {
    const upload = await this.db.query.uploads.findFirst({
      where: eq(schema.uploads.id, id),
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

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return upload;
  }

  /**
   * ADMIN: Approve or reject a customer upload. Records which admin
   * performed the review and when. Requires a rejection reason whenever
   * the upload is being rejected.
   */
  async reviewUpload(id: string, adminId: string, dto: ReviewUploadDto): Promise<Upload> {
    if (dto.status === UploadStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A rejection reason is required when rejecting an upload');
    }

    const [updated] = await this.db
      .update(schema.uploads)
      .set({
        status: dto.status,
        rejectionReason: dto.status === UploadStatus.REJECTED ? dto.rejectionReason : null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.uploads.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Upload not found');
    }

    return updated;
  }
}