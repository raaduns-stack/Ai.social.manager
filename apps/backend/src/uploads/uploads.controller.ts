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

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file and save its metadata' })
  @ApiConsumes('multipart/form-data')
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() createUploadDto: CreateUploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadsService.uploadFile(user.userId, file, createUploadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all uploads belonging to the authenticated user' })
  async getMyUploads(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryUploadDto,
  ) {
    return this.uploadsService.getMyUploads(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single upload' })
  async getUploadById(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.uploadsService.getUploadById(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update upload category' })
  async updateUpload(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateUploadDto: UpdateUploadDto,
  ) {
    return this.uploadsService.updateUpload(id, user.userId, updateUploadDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download an uploaded file' })
  async downloadFile(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const fileInfo = await this.uploadsService.getUploadById(id, user.userId);
    const filePath = join(process.cwd(), 'uploads', fileInfo.storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    res.download(filePath, fileInfo.originalName);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an upload and remove it from local storage' })
  async deleteUpload(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.uploadsService.deleteUpload(id, user.userId);
  }
}
