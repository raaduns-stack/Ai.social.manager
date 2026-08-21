import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'RaaSocial API',
      status: 'running',
    };
  }
}
