import { Inject, Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { PublishingLogEntry } from '@socialpilot/shared-types';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { decryptSecret } from '../common/utils/encryption.util';

type Database = PostgresJsDatabase<typeof schema>;

const SNAPCHAT_API_BASE = 'https://businessapi.snapchat.com';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly socialAccountsService: SocialAccountsService,
  ) {}

  async dispatchPost(body: {
    scheduledPostId: string;
    platform: string;
    content: string;
    mediaUrl: string | null;
    socialAccountId: string;
    idempotencyKey: string | null;
  }) {
    if (body.platform === 'snapchat') {
      return this.publishToSnapchat(body);
    }

    // Other platforms: existing mock behavior
    const mockPostId = `mock-${body.platform.toLowerCase()}-${Date.now()}`;
    return {
      success: true,
      externalPostId: mockPostId,
    };
  }

  /**
   * Publish content to a connected Snapchat Public Profile.
   *
   * Flow:
   * 1. Validate media is present (text-only unsupported).
   * 2. Retrieve the social account and ensure the token is fresh.
   * 3. Download the media, determine type, encrypt it with AES-256-CBC.
   * 4. Initialize a media container on Snapchat.
   * 5. Upload the encrypted media via multipart.
   * 6. Finalize the upload.
   * 7. Publish as a Story.
   */
  async publishToSnapchat(body: {
    scheduledPostId: string;
    platform: string;
    content: string;
    mediaUrl: string | null;
    socialAccountId: string;
    idempotencyKey: string | null;
  }) {
    // 1. Snapchat requires media — reject text-only posts
    if (!body.mediaUrl) {
      throw new BadRequestException(
        'Snapchat does not support text-only posts. A media file (image or video) is required.',
      );
    }

    // 2. Retrieve the social account record
    const account = await this.db.query.social_accounts.findFirst({
      where: eq(schema.social_accounts.id, body.socialAccountId),
    });

    if (!account || account.platform !== 'snapchat') {
      throw new BadRequestException('Snapchat social account not found.');
    }

    if (!account.accessTokenEncrypted) {
      throw new BadRequestException('Snapchat access token not available. Please reconnect.');
    }

    if (!account.externalAccountId) {
      throw new BadRequestException('Snapchat profile ID not available. Please reconnect.');
    }

    // 3. Refresh the token if expired or expiring within 10 minutes
    const tokenExpiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt).getTime() : 0;
    const tenMinutesFromNow = Date.now() + 10 * 60 * 1000;

    if (tokenExpiresAt < tenMinutesFromNow) {
      this.logger.log(`Snapchat token expiring soon for account ${account.id}, refreshing...`);
      try {
        await this.socialAccountsService.refreshSnapchatToken(account.id);
      } catch {
        throw new BadRequestException(
          'Snapchat token refresh failed. The account may require re-authentication.',
        );
      }

      // Re-fetch the account to get the updated encrypted token
      const refreshedAccount = await this.db.query.social_accounts.findFirst({
        where: eq(schema.social_accounts.id, body.socialAccountId),
      });
      if (!refreshedAccount?.accessTokenEncrypted) {
        throw new BadRequestException('Unable to retrieve refreshed Snapchat token.');
      }
      // Use the refreshed token
      return this.executeSnapchatPublish(
        refreshedAccount.accessTokenEncrypted,
        refreshedAccount.externalAccountId!,
        body.mediaUrl,
        body.scheduledPostId,
      );
    }

    return this.executeSnapchatPublish(
      account.accessTokenEncrypted,
      account.externalAccountId,
      body.mediaUrl,
      body.scheduledPostId,
    );
  }

  /**
   * Execute the full Snapchat publishing pipeline:
   * download → encrypt → init container → upload → finalize → publish story
   */
  private async executeSnapchatPublish(
    accessTokenEncrypted: string,
    profileId: string,
    mediaUrl: string,
    scheduledPostId: string,
  ) {
    const accessToken = decryptSecret(accessTokenEncrypted);

    // 1. Download the media file
    let mediaBuffer: Buffer;
    let contentType: string;
    try {
      const mediaResponse = await fetch(mediaUrl);
      if (!mediaResponse.ok) {
        throw new Error(`Failed to download media: HTTP ${mediaResponse.status}`);
      }
      contentType = mediaResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await mediaResponse.arrayBuffer();
      mediaBuffer = Buffer.from(arrayBuffer);
    } catch (err: any) {
      this.logger.error(`Failed to download Snapchat media from ${mediaUrl}: ${err.message}`);
      throw new BadRequestException('Failed to download media for Snapchat publishing.');
    }

    // 2. Determine media type
    const mediaType = this.resolveSnapchatMediaType(contentType);
    if (!mediaType) {
      throw new BadRequestException(
        `Unsupported media type for Snapchat: ${contentType}. Snapchat supports JPEG/PNG images and MP4 videos.`,
      );
    }

    // 3. Encrypt the media with AES-256-CBC
    const aesKey = crypto.randomBytes(32);
    const aesIv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, aesIv);
    const encryptedMedia = Buffer.concat([cipher.update(mediaBuffer), cipher.final()]);

    const key64 = aesKey.toString('base64');
    const iv64 = aesIv.toString('base64');

    // 4. Initialize the media container
    let mediaId: string;
    let addPath: string;
    let finalizePath: string;

    try {
      const initResponse = await fetch(
        `${SNAPCHAT_API_BASE}/v1/public_profiles/${profileId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type: mediaType,
            name: `socialpilot-${scheduledPostId}`,
            key: key64,
            iv: iv64,
          }),
        },
      );

      if (!initResponse.ok) {
        await this.handleSnapchatApiError(initResponse, 'media initialization');
      }

      const initData = await initResponse.json();
      mediaId = initData.media_id;
      addPath = initData.add_path;
      finalizePath = initData.finalize_path;

      if (!mediaId || !addPath || !finalizePath) {
        throw new BadRequestException('Snapchat media initialization returned incomplete data.');
      }
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      this.logger.error(`Snapchat media init error: ${err.message}`);
      throw new BadRequestException('Failed to initialize Snapchat media container.');
    }

    // 5. Upload the encrypted media via multipart form-data
    try {
      const boundary = `----SnapUpload${Date.now()}`;
      const uploadBody = this.buildMultipartBody(boundary, encryptedMedia, 'ADD', 1);

      const uploadResponse = await fetch(`${SNAPCHAT_API_BASE}${addPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${accessToken}`,
        },
        body: new Uint8Array(uploadBody),
      });

      if (!uploadResponse.ok) {
        await this.handleSnapchatApiError(uploadResponse, 'media upload');
      }
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      this.logger.error(`Snapchat media upload error: ${err.message}`);
      throw new BadRequestException('Failed to upload media to Snapchat.');
    }

    // 6. Finalize the upload
    try {
      const boundary = `----SnapFinalize${Date.now()}`;
      const finalizeBody = this.buildFinalizeBody(boundary);

      const finalizeResponse = await fetch(`${SNAPCHAT_API_BASE}${finalizePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${accessToken}`,
        },
        body: new Uint8Array(finalizeBody),
      });

      if (!finalizeResponse.ok) {
        await this.handleSnapchatApiError(finalizeResponse, 'media finalization');
      }
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      this.logger.error(`Snapchat media finalize error: ${err.message}`);
      throw new BadRequestException('Failed to finalize Snapchat media upload.');
    }

    // 7. Post the Story
    try {
      const storyResponse = await fetch(
        `${SNAPCHAT_API_BASE}/v1/public_profiles/${profileId}/stories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ media_id: mediaId }),
        },
      );

      if (!storyResponse.ok) {
        await this.handleSnapchatApiError(storyResponse, 'story publishing');
      }

      const storyData = await storyResponse.json();
      const externalPostId = storyData.story_id || storyData.id || `snap-story-${Date.now()}`;

      this.logger.log(`Successfully published Snapchat story for post ${scheduledPostId}.`);

      return {
        success: true,
        externalPostId,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      this.logger.error(`Snapchat story publish error: ${err.message}`);
      throw new BadRequestException('Failed to publish Snapchat story.');
    }
  }

  /**
   * Resolve 'IMAGE' or 'VIDEO' from the media content-type.
   * Returns null for unsupported types.
   */
  private resolveSnapchatMediaType(contentType: string): 'IMAGE' | 'VIDEO' | null {
    const ct = contentType.toLowerCase();
    if (ct.includes('image/jpeg') || ct.includes('image/png') || ct.includes('image/jpg')) {
      return 'IMAGE';
    }
    if (ct.includes('video/mp4')) {
      return 'VIDEO';
    }
    return null;
  }

  /**
   * Handle Snapchat API errors with actionable messages.
   * Throws BadRequestException or ForbiddenException.
   */
  private async handleSnapchatApiError(response: Response, step: string): Promise<never> {
    const status = response.status;
    let errorText: string;
    try {
      errorText = await response.text();
    } catch {
      errorText = 'Unable to read error response';
    }

    this.logger.error(`Snapchat ${step} failed: HTTP ${status} - ${errorText}`);

    if (status === 401) {
      throw new BadRequestException(
        'Snapchat authentication failed. The access token may be invalid or expired. Please reconnect your Snapchat account.',
      );
    }

    if (status === 403) {
      throw new ForbiddenException(
        'Snapchat returned 403 Forbidden. Ensure your app is allowlisted for the snapchat-profile-api scope and your profile has the Admin/Collaborator role.',
      );
    }

    if (status === 429) {
      throw new BadRequestException(
        'Snapchat rate limit exceeded. Please try again later.',
      );
    }

    throw new BadRequestException(
      `Snapchat ${step} failed with HTTP ${status}. Please try again.`,
    );
  }

  /**
   * Build a multipart/form-data body for the ADD action (chunk upload).
   */
  private buildMultipartBody(
    boundary: string,
    fileData: Buffer,
    action: string,
    partNumber: number,
  ): Buffer {
    const parts: Buffer[] = [];

    // action field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\n${action}\r\n`,
    ));

    // part_number field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="part_number"\r\n\r\n${partNumber}\r\n`,
    ));

    // file field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="media.enc"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ));
    parts.push(fileData);
    parts.push(Buffer.from('\r\n'));

    // closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    return Buffer.concat(parts);
  }

  /**
   * Build a multipart/form-data body for the FINALIZE action.
   */
  private buildFinalizeBody(boundary: string): Buffer {
    const parts: Buffer[] = [];

    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\nFINALIZE\r\n`,
    ));

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    return Buffer.concat(parts);
  }

  async createLogEntry(entry: PublishingLogEntry) {
    return this.db.transaction(async (tx) => {
      // 1. Insert the publishing log
      await tx.insert(schema.publishingLogs).values({
        scheduledPostId: entry.scheduledPostId,
        status: entry.status,
        externalPostId: entry.externalPostId || null,
        error: entry.error || null,
        attemptedAt: new Date(entry.attemptedAt),
      });

      // 2. Update the corresponding ScheduledPost's status
      await tx
        .update(schema.scheduledPosts)
        .set({
          status: entry.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.scheduledPosts.scheduledPostId, entry.scheduledPostId));

      return { success: true };
    });
  }
}
