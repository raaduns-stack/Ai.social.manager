/**
 * kyc.module.ts
 * ---------------------------------------------------------------------------
 * NestJS module that wires together the KYC controller, service, and Multer
 * disk-storage configuration.
 *
 * The Multer setup mirrors the existing UploadsModule exactly:
 *   - Files land in the shared `uploads/` directory on disk.
 *   - Filenames use the same `fieldname-timestamp-random.ext` pattern.
 *   - Accepted MIME types are restricted to PDF, JPG, JPEG, and PNG.
 *
 * The KycService is exported so that SocialAccountsModule can inject it
 * for the channel-connection KYC gate.
 * ---------------------------------------------------------------------------
 */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

import { KycController, AdminKycController } from './kyc.controller';
import { KycService } from './kyc.service';

// Allowed MIME types for KYC documents
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        // Reuse the same shared `uploads/` directory on disk
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        // Same naming convention: fieldname-timestamp-random.ext
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      // Reject any file whose MIME type is not in the allowed list
      fileFilter: (_req, file, callback) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Allowed types: PDF, JPG, JPEG, PNG.`,
            ),
            false,
          );
        }
      },
      // Cap each document at 10 MB
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [KycController, AdminKycController],
  providers: [KycService],
  // Export KycService so SocialAccountsModule can inject it for the KYC gate
  exports: [KycService],
})
export class KycModule {}
