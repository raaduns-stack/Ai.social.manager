import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'SocialPilot AI API',
      status: 'running',
    };
  }
}
