import { Body, Controller, Get, Post, Patch, UseGuards, Req, Res, UnauthorizedException, UseInterceptors, UploadedFile, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { TumblrService } from './tumblr.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tumblrService: TumblrService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new client account' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.register(dto);
    if (data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return data;
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(@Req() req: Request, @Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.login(dto, req);
    if (data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return data;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@CurrentUser() user: { userId: string }) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Post('profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile image for authenticated user' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
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
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only JPG, JPEG, PNG, and WebP images are allowed'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfileImage(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No image file uploaded');
    return this.authService.updateProfileImage(user.userId, file.filename);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with 6-digit OTP' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a valid HTTP-Only refresh token for a fresh access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, newRefreshToken } = await this.authService.refreshTokens(refreshToken);

    // Set new HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken };
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user role and permissions' })
  getPermissions(@CurrentUser() user: { userId: string; role: string }) {
    return this.authService.getPermissions(user.userId, user.role);
  }

  @Get('tumblr')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate Tumblr OAuth flow' })
  async tumblrAuth(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
  ) {
    try {
      const { oauth_token, oauth_token_secret } = await this.tumblrService.getRequestToken();

      // Store credentials and user ID in a signed cookie
      res.cookie(
        'tumblr_oauth_cookie',
        JSON.stringify({
          oauth_token_secret,
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

      res.redirect(`https://www.tumblr.com/oauth/authorize?oauth_token=${oauth_token}`);
    } catch (err: any) {
      this.logger.error(`Tumblr auth initiation failed: ${err.message}`, err.stack);
      const frontendUrl = this.configService.get<string>('frontendUrl') || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/settings/accounts?tumblr=error`);
    }
  }

  @Get('tumblr/callback')
  @ApiOperation({ summary: 'Handle Tumblr OAuth callback' })
  async tumblrAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const oauthToken = req.query.oauth_token as string;
      const oauthVerifier = req.query.oauth_verifier as string;

      if (!oauthToken || !oauthVerifier) {
        throw new BadRequestException('Callback query params oauth_token or oauth_verifier are missing.');
      }

      const cookieDataStr = req.signedCookies?.tumblr_oauth_cookie;
      if (!cookieDataStr) {
        throw new BadRequestException('OAuth session cookie expired or missing.');
      }

      const { oauth_token_secret, userId } = JSON.parse(cookieDataStr);

      const { token, tokenSecret, blogName } = await this.tumblrService.getAccessToken(
        oauthToken,
        oauth_token_secret,
        oauthVerifier,
      );

      await this.tumblrService.connectAccount(userId, token, tokenSecret, blogName);

      res.clearCookie('tumblr_oauth_cookie', { path: '/', signed: true });
      const frontendUrl = this.configService.get<string>('frontendUrl') || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/settings/accounts?tumblr=success`);
    } catch (err: any) {
      this.logger.error(`Tumblr callback handshake failed: ${err.message}`, err.stack);
      res.clearCookie('tumblr_oauth_cookie', { path: '/', signed: true });
      const frontendUrl = this.configService.get<string>('frontendUrl') || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/settings/accounts?tumblr=error`);
    }
  }
}

