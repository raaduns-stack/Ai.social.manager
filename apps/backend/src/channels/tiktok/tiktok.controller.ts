import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Headers,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { TikTokService } from './tiktok.service';
import { TikTokCallbackQueryDto } from './dto/tiktok-callback.query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('channels')
@Controller('channels/tiktok')
export class TikTokController {
  private readonly logger = new Logger(TikTokController.name);

  constructor(private readonly tiktokService: TikTokService) {}

  // ---------------------------------------------------------------------------
  // GET /api/channels/tiktok/connect
  //
  // Called by the frontend when the user clicks "Connect TikTok".
  // Returns the TikTok authorization URL (with a signed state JWT embedded)
  // so the frontend can redirect the user's browser to TikTok.
  // ---------------------------------------------------------------------------
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Begin TikTok OAuth flow — returns the TikTok authorization URL',
    description:
      'The frontend should redirect the user to the returned `authUrl`. ' +
      'The `state` parameter embedded in the URL is a short-lived signed JWT ' +
      'containing the authenticated userId, so the callback can associate the ' +
      'TikTok account with the correct RaaSocial user without server-side sessions.',
  })
  async connect(@CurrentUser() user: { userId: string }) {
    const stateJwt = await this.tiktokService.generateStateJwt(user.userId);

    // Build the TikTok authorization URL.
    // Scopes granted in the TikTok Developer Portal: user.info.basic, video.upload
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
      scope: 'user.info.basic,video.upload',
      response_type: 'code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI ?? '',
      state: stateJwt,
    });

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

    return { authUrl };
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/tiktok/callback
  //
  // TikTok redirects the user's browser here after they authorize (or deny)
  // the application.
  //
  // Production URL: https://raasocial.io/api/channels/tiktok/callback
  // ---------------------------------------------------------------------------
  @Get('callback')
  @ApiOperation({
    summary: 'TikTok Login Kit OAuth callback — DO NOT call directly',
    description:
      'This endpoint is the redirect URI registered in the TikTok Developer Portal. ' +
      'TikTok sends the browser here after the user authorizes the app. ' +
      'It validates the state JWT, exchanges the code for tokens, stores them ' +
      'encrypted, and redirects the browser back to the frontend.',
  })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'scopes', required: false })
  @ApiQuery({ name: 'error', required: false })
  @ApiQuery({ name: 'error_description', required: false })
  async callback(
    @Query() query: TikTokCallbackQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://raasocial.io';
    const errorBase = `${frontendUrl}/settings?tab=channels&tiktok=error`;

    // Handle user-denied / TikTok-level errors
    if (query.error) {
      this.logger.warn(
        `TikTok callback error: ${query.error} — ${query.error_description}`,
      );
      res.redirect(
        `${errorBase}&reason=${encodeURIComponent(query.error)}`,
      );
      return;
    }

    // Both code and state are required for a successful callback
    if (!query.code || !query.state) {
      this.logger.warn('TikTok callback: missing code or state parameter');
      res.redirect(`${errorBase}&reason=missing_params`);
      return;
    }

    await this.tiktokService.handleCallback(query.code, query.state, res);
  }

  // ---------------------------------------------------------------------------
  // POST /api/channels/tiktok/webhook
  //
  // TikTok sends event notifications to this endpoint.
  //
  // Production URL: https://raasocial.io/api/channels/tiktok/webhook
  //
  // IMPORTANT: NestJS's global ValidationPipe (whitelist: true) would strip
  // unknown fields from the raw body before it reaches the handler.
  // To validate the HMAC signature we need the raw bytes, so we read
  // `req.body` directly (it will be the parsed JSON object) and rely on
  // the RawBodyMiddleware set up in main.ts.  If raw body middleware is not
  // yet configured, the signature check will be skipped gracefully.
  // ---------------------------------------------------------------------------
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'TikTok webhook event receiver',
    description:
      'Receives and validates webhook events from TikTok using HMAC-SHA256. ' +
      'The endpoint always returns 200 OK to acknowledge receipt. ' +
      'Signature validation uses TIKTOK_CLIENT_SECRET.',
  })
  webhook(
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ): { message: string } {
    // Use the raw body buffer if available (set by a rawBody middleware),
    // otherwise fall back to the JSON-stringified parsed body.
    // For correct HMAC validation, configure express rawBody middleware in main.ts.
    const rawBody: Buffer =
      (req as any).rawBody instanceof Buffer
        ? (req as any).rawBody
        : Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');

    return this.tiktokService.handleWebhook(headers, rawBody, req.body);
  }
}
