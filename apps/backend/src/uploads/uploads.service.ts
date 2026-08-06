import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, ilike } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { QueryUploadDto } from './dto/query-upload.dto';
import { Upload } from '../database/schema/uploads.schema';

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
    file: Express.Multer.File,
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
}