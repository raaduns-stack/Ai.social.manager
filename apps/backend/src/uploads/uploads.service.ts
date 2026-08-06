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

@Injectable()
export class UploadsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Upload a file and save its metadata to the database.
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    createUploadDto: CreateUploadDto,
  ): Promise<Upload> {
    const fileUrl = `/uploads/${file.filename}`;
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
   * Get all uploads for the authenticated user with optional category filtering and pagination.
   */
  async getMyUploads(userId: string, query: QueryUploadDto): Promise<Upload[]> {
    const conditions = [eq(schema.uploads.userId, userId)];

    if (query.category) {
      conditions.push(eq(schema.uploads.category, query.category));
    }

    if (query.search) {
      conditions.push(ilike(schema.uploads.originalName, `%${query.search}%`));
    }

    return this.db.query.uploads.findMany({
      where: and(...conditions),
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
    });
  }

  /**
   * Get a single upload by ID.
   */
  async getUploadById(id: string, userId: string): Promise<Upload> {
    const upload = await this.db.query.uploads.findFirst({
      where: and(eq(schema.uploads.id, id), eq(schema.uploads.userId, userId)),
    });
    if (!upload) {
      throw new NotFoundException('Upload not found');
    }
    return upload;
  }

  /**
   * Update upload metadata (such as category).
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
        updatedAt: new Date(),
      })
      .where(and(eq(schema.uploads.id, id), eq(schema.uploads.userId, userId)))
      .returning();
    if (!updated) {
      throw new NotFoundException('Upload not found');
    }
    return updated;
  }

  /**
   * Delete an upload from both the database and the local disk.
   */
  async deleteUpload(id: string, userId: string): Promise<void> {
    const [deleted] = await this.db
      .delete(schema.uploads)
      .where(and(eq(schema.uploads.id, id), eq(schema.uploads.userId, userId)))
      .returning();
    if (!deleted) {
      throw new NotFoundException('Upload not found');
    }

    // Delete the local file
    const filePath = join(process.cwd(), 'uploads', deleted.storedName);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to delete local file: ${filePath}`, err);
    }
  }
}
