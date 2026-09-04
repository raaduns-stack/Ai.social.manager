import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { TumblrService } from './tumblr.service';
import { SendTumblrPostDto } from './dto/send-tumblr-post.dto';
import { SelectTumblrBlogDto } from './dto/select-tumblr-blog.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('channels')
@Controller('channels/tumblr')
export class TumblrController {
  private readonly logger = new Logger(TumblrController.name);

  constructor(
    private readonly tumblrService: TumblrService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /api/channels/tumblr/connect
  // ---------------------------------------------------------------------------
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Begin Tumblr OAuth flow — returns the Tumblr authorization URL',
    description:
      'The frontend should redirect the user to the returned `authUrl`.',
  })
  async connect(@CurrentUser() user: { userId: string }, @Res() res: Response) {
    try {
      const { oauth_token, oauth_token_secret } =
        await this.tumblrService.getRequestToken();

      const stateJwt = await this.tumblrService.generateStateJwt(user.userId);

      // Store request token secret & state in cookie for callback validation
      res.cookie(
        'tumblr_oauth_cookie',
        JSON.stringify({
          oauth_token_secret,
          state: stateJwt,
          userId: user.userId,
        }),
        {
          httpOnly: true,
          signed: true,
          maxAge: 10 * 60 * 1000, // 10 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        },
      );

      const authUrl = `https://www.tumblr.com/oauth/authorize?oauth_token=${oauth_token}`;

      return res.json({ authUrl });
    } catch (err: any) {
      this.logger.error(`Tumblr connect failed: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to initiate Tumblr OAuth: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/tumblr/callback
  // ---------------------------------------------------------------------------
  @Get('callback')
  @ApiOperation({
    summary: 'Tumblr OAuth1.0a callback — DO NOT call directly',
  })
  async callback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>('frontendUrl') ||
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN ||
      'http://localhost:5173';

    try {
      const oauthToken = req.query.oauth_token as string;
      const oauthVerifier = req.query.oauth_verifier as string;

      if (!oauthToken || !oauthVerifier) {
        throw new BadRequestException('Missing oauth_token or oauth_verifier in callback query.');
      }

      // Read stored cookie
      const cookieDataStr = req.signedCookies?.['tumblr_oauth_cookie'];
      if (!cookieDataStr) {
        throw new BadRequestException('Tumblr OAuth session expired or missing cookie.');
      }

      const { oauth_token_secret, userId } = JSON.parse(cookieDataStr);

      if (!oauth_token_secret || !userId) {
        throw new BadRequestException('Invalid OAuth session data in cookie.');
      }

      // Clear cookie
      res.clearCookie('tumblr_oauth_cookie', { path: '/' });

      // Exchange request token for access token
      const { token, tokenSecret } = await this.tumblrService.getAccessToken(
        oauthToken,
        oauth_token_secret,
        oauthVerifier,
      );

      // Fetch user profile and primary blog
      const { primaryBlogName } = await this.tumblrService.getUserProfileAndBlogs(
        token,
        tokenSecret,
      );

      // Save connection
      await this.tumblrService.connectAccount(
        userId,
        token,
        tokenSecret,
        primaryBlogName,
      );

      this.logger.log(`Tumblr connected successfully for user ${userId} (blog: ${primaryBlogName})`);

      return res.redirect(`${frontendUrl}/dashboard/channels?tumblr=success`);
    } catch (err: any) {
      this.logger.error(`Tumblr OAuth callback failed: ${err.message}`, err.stack);
      return res.redirect(`${frontendUrl}/dashboard/channels?tumblr=error&message=${encodeURIComponent(err.message)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/tumblr/status
  // ---------------------------------------------------------------------------
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user Tumblr connection status' })
  async getStatus(@CurrentUser() user: { userId: string }) {
    return this.tumblrService.getTumblrStatus(user.userId);
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/channels/tumblr
  // ---------------------------------------------------------------------------
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Tumblr account' })
  async disconnect(@CurrentUser() user: { userId: string }) {
    return this.tumblrService.disconnectTumblr(user.userId);
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/tumblr/blogs
  // ---------------------------------------------------------------------------
  @Get('blogs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch user Tumblr blogs' })
  async getBlogs(@CurrentUser() user: { userId: string }) {
    return this.tumblrService.getUserBlogs(user.userId);
  }

  // ---------------------------------------------------------------------------
  // POST /api/channels/tumblr/select-blog
  // ---------------------------------------------------------------------------
  @Post('select-blog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select target Tumblr blog name for posting' })
  async selectBlog(
    @CurrentUser() user: { userId: string },
    @Body() dto: SelectTumblrBlogDto,
  ) {
    return this.tumblrService.selectTargetBlog(user.userId, dto.blogName);
  }

  // ---------------------------------------------------------------------------
  // POST /api/channels/tumblr/send-post
  // ---------------------------------------------------------------------------
  @Post('send-post')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post content directly to a Tumblr blog' })
  async sendPost(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendTumblrPostDto,
  ) {
    return this.tumblrService.sendPost(user.userId, {
      blogName: dto.blogName,
      content: dto.content,
      title: dto.title,
      mediaUrl: dto.mediaUrl,
      type: dto.type,
    });
  }
}
