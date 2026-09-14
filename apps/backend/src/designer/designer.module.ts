/**
 * designer.module.ts
 * ---------------------------------------------------------------------------
 * NestJS module for the Designer Portal workspace.
 *
 * Exposes a single designer-facing controller under /designer/* guarded to
 * designer-role JWTs. Submission file uploads use the same Multer pattern as
 * KycModule / UploadsModule: shared `uploads/` disk storage,
 * `fieldname-timestamp-random.ext` naming, image+PDF files only, 10 MB cap.
 * ---------------------------------------------------------------------------
 */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

import { DesignerController } from './designer.controller';
import { DesignerService } from './designer.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Allowed types: JPG, JPEG, PNG, WEBP, SVG, PDF.`,
            ),
            false,
          );
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [DesignerController],
  providers: [DesignerService],
  exports: [DesignerService],
})
export class DesignerModule {}
