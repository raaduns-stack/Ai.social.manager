import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { UploadsService } from '../../uploads/uploads.service';
import { QueryAdminUploadDto } from '../../uploads/dto/query-admin-upload.dto';
import { ReviewUploadDto } from '../../uploads/dto/review-upload.dto';

@ApiTags('admin-uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/uploads')
export class AdminUploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    // =========================
    // Get All Customer Uploads (moderation queue)
    // =========================
    @Get()
    @RequirePermission('upload_management', 'view')
    @ApiOperation({ summary: 'Get all customer uploads for moderation (filterable by category, status, customer)' })
    getAllUploads(@Query() query: QueryAdminUploadDto) {
        return this.uploadsService.getAllUploadsForAdmin(query);
    }

    // =========================
    // Get Single Upload (any customer)
    // =========================
    @Get(':id')
    @RequirePermission('upload_management', 'view')
    @ApiOperation({ summary: 'Get details/metadata of any customer upload' })
    getUploadById(@Param('id') id: string) {
        return this.uploadsService.getUploadByIdForAdmin(id);
    }

    // =========================
    // Approve / Reject Upload
    // =========================
    @Patch(':id/review')
    @RequirePermission('upload_management', 'approve')
    @ApiOperation({ summary: 'Approve or reject a customer upload' })
    reviewUpload(
        @CurrentUser() admin: { userId: string },
        @Param('id') id: string,
        @Body() dto: ReviewUploadDto,
    ) {
        return this.uploadsService.reviewUpload(id, admin.userId, dto);
    }

    // =========================
    // Download Any Customer's File
    // =========================
    @Get(':id/download')
    @RequirePermission('upload_management', 'view')
    @ApiOperation({ summary: "Download a customer's uploaded file" })
    async downloadFile(@Param('id') id: string, @Res() res: Response) {
        const fileInfo = await this.uploadsService.getUploadByIdForAdmin(id);

        const filePath = join(process.cwd(), 'uploads', fileInfo.storedName);

        if (!existsSync(filePath)) {
            throw new NotFoundException('File not found on disk');
        }

        res.download(filePath, fileInfo.originalName);
    }
}