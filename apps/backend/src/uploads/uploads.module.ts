import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

// Defines the Uploads module
@Module({
  imports: [
    // Configure Multer for handling file uploads
    MulterModule.register({
      storage: diskStorage({
        // Set the destination folder where uploaded files will be stored
        destination: (req, file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads');

          // Create the uploads folder if it doesn't already exist
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          // Save the uploaded file in the uploads directory
          callback(null, uploadPath);
        },

        // Generate a unique filename for every uploaded file
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

          // Preserve the original file extension
          const ext = extname(file.originalname);

          // Example: file-1723034567890-123456789.png
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],

  // Register the controller responsible for upload endpoints
  controllers: [UploadsController],

  // Register the service containing upload business logic
  providers: [UploadsService],

  // Export the service so it can be used by other modules
  exports: [UploadsService],
})
export class UploadsModule { }
