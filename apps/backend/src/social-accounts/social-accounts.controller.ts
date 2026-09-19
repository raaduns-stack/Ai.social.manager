import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialAccountsService } from './social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@ApiTags('social-accounts')
@Controller('social-accounts')
export class SocialAccountsController {
  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('snapchat/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate Snapchat OAuth 2.0 connection flow for authenticated user',
  })
  @ApiQuery({
    name: 'json',
    required: false,
    type: Boolean,
    description: 'If true, returns the authorization URL in a JSON payload instead of redirecting',
  })
  async connectSnapchat(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const authUrl = await this.socialAccountsService.getSnapchatAuthUrl(user.userId);

    const wantsJson =
      req.query?.json === 'true' ||
      (req.headers?.accept?.includes('application/json') &&
        !req.headers?.accept?.includes('text/html'));

    if (wantsJson) {
      return res.json({ url: authUrl });
    }

    return res.redirect(authUrl);
  }

  @Get('snapchat/callback')
  @ApiOperation({
    summary: 'Snapchat OAuth 2.0 Redirect/Callback receiver endpoint',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
    description: 'Snapchat authorization code',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    type: String,
    description: 'Encrypted OAuth state parameter',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    type: String,
    description: 'OAuth error code if denied',
  })
  @ApiQuery({
    name: 'error_description',
    required: false,
    type: String,
    description: 'Error description if denied',
  })
  async snapchatCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
    @Res() res?: Response,
  ) {
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:5173';
    const channelsUrl = `${frontendUrl}/dashboard/channels`;

    try {
      const result = await this.socialAccountsService.handleSnapchatCallback({
        code,
        state,
        error,
        error_description: errorDescription,
      });

      if (res) {
        if (!result.success) {
          // OAuth was cancelled/denied — redirect with error
          const errMsg = encodeURIComponent(
            result.errorDescription || result.error || 'Connection cancelled.',
          );
          return res.redirect(`${channelsUrl}?snapchat_error=${errMsg}`);
        }
        // Success — redirect back to channels page with success indicator
        return res.redirect(`${channelsUrl}?connected=snapchat`);
      }
      return result;
    } catch (err: any) {
      if (res) {
        const errMsg = encodeURIComponent(err?.message || 'An unexpected error occurred.');
        return res.redirect(`${channelsUrl}?snapchat_error=${errMsg}`);
      }
      throw err;
    }
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new social account for the authenticated user' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateSocialAccountDto) {
    return this.socialAccountsService.create(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all social accounts for the authenticated user' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.socialAccountsService.findAll(user.userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update a social account (status / token expiration) for the authenticated user',
  })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSocialAccountDto,
  ) {
    return this.socialAccountsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a social account for the authenticated user' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.socialAccountsService.remove(user.userId, id);
  }
}
