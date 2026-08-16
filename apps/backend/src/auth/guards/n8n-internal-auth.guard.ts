import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class N8nInternalAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Headers are case-insensitive in Express/NestJS, but usually lowercased.
    const apiKey = request.headers['x-n8n-api-key'];
    const expectedKey = this.configService.get<string>('n8n.internalApiKey') || 
                        this.configService.get<string>('N8N_INTERNAL_API_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException('n8n internal API key is not configured.');
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Unauthorized access: Invalid n8n API Key.');
    }

    return true;
  }
}
