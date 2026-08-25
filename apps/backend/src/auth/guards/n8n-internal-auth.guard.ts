import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class N8nInternalAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  private safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Headers are case-insensitive in Express/NestJS, but usually lowercased.
    const apiKey = request.headers['x-n8n-api-key'];
    const expectedKey =
      this.configService.get<string>('n8n.internalApiKey') ||
      this.configService.get<string>('N8N_INTERNAL_API_KEY') ||
      process.env.N8N_INTERNAL_API_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException('n8n internal API key is not configured.');
    }

    if (!apiKey || !this.safeCompare(apiKey as string, expectedKey)) {
      throw new UnauthorizedException('Unauthorized access: Invalid n8n API Key.');
    }

    return true;
  }
}
