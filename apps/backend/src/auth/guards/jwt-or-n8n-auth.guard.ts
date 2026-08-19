import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class JwtOrN8nAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  private safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-n8n-api-key'];
    const expectedKey =
      this.configService.get<string>('n8n.internalApiKey') ||
      this.configService.get<string>('N8N_INTERNAL_API_KEY') ||
      process.env.N8N_INTERNAL_API_KEY;

    // Check if valid n8n internal API key header is supplied
    if (apiKey && expectedKey && this.safeCompare(apiKey as string, expectedKey)) {
      request.isN8n = true;
      return true;
    }

    // Fall back to JWT validation for user session requests
    try {
      const can = await super.canActivate(context);
      return Boolean(can);
    } catch (err) {
      throw new UnauthorizedException(
        'Unauthorized access: Valid user JWT or n8n API Key required.',
      );
    }
  }
}
