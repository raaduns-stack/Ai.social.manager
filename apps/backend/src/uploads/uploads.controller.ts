import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Param,
  BadRequestException,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { QueryUploadDto } from './dto/query-upload.dto';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

// Groups all endpoints under the "uploads" section in Swagger
@ApiTags('uploads')

// Indicates that these endpoints require Bearer Token authentication
@ApiBearerAuth()

// Protects all routes in this controller using JWT authentication
@UseGuards(JwtAuthGuard)

// Base route: /uploads
@Controller('uploads')
export class UploadsController {
  // Inject the UploadsService for handling business logic
  constructor(private readonly uploadsService: UploadsService) { }

  // =========================
  // Upload File
  // =========================
  @Post()
  @ApiOperation({ summary: 'Upload a file and save its metadata' })

  // Specifies that this endpoint accepts multipart/form-data
  @ApiConsumes('multipart/form-data')

  // Defines the request body structure for Swagger documentation
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        category: {
          type: 'string',
          description: 'Category of the uploaded asset',
        },
      },
    },
  })

  // Handles the uploaded file using Multer
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: { userId: string }, // Currently authenticated user
    @UploadedFile() file: any, // Uploaded file
    @Body() createUploadDto: CreateUploadDto, // Upload metadata (category, etc.)
  ) {
    // Ensure a file was actually uploaded
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Save the file metadata to the database
    return this.uploadsService.uploadFile(user.userId, file, createUploadDto);
  }

  // =========================
  // Get All User Uploads
  // =========================
  @Get()
  @ApiOperation({ summary: 'Get all uploads belonging to the authenticated user' })
  async getMyUploads(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryUploadDto, // Optional filters, pagination, etc.
  ) {
    return this.uploadsService.getMyUploads(user.userId, query);
  }

  // =========================
  // Get Single Upload
  // =========================
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single upload' })
  async getUploadById(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string, // Upload ID
  ) {
    return this.uploadsService.getUploadById(id, user.userId);
  }

  // =========================
  // Update Upload
  // =========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update upload category' })
  async updateUpload(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateUploadDto: UpdateUploadDto,
  ) {
    return this.uploadsService.updateUpload(id, user.userId, updateUploadDto);
  }

  // =========================
  // Download Uploaded File
  // =========================
  @Get(':id/download')
  @ApiOperation({ summary: 'Download an uploaded file' })
  async downloadFile(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // Retrieve upload details from the database
    const fileInfo = await this.uploadsService.getUploadById(id, user.userId);

    // Construct the file path on the server
    const filePath = join(process.cwd(), 'uploads', fileInfo.storedName);

    // Verify the file still exists on disk
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Send the file to the client for download
    res.download(filePath, fileInfo.originalName);
  }

  // =========================
  // Delete Upload
  // =========================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an upload and remove it from local storage' })
  async deleteUpload(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.uploadsService.deleteUpload(id, user.userId);
  }
}