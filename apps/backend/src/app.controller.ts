import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

// Groups this controller under the "root" section in Swagger
@ApiTags('root')

// Defines the root route ("/")
@Controller()
export class AppController {
  // Inject the AppService
  constructor(private readonly appService: AppService) { }

  // Handles GET requests to the root endpoint
  @Get()
  getInfo() {
    // Return the application information from the service
    return this.appService.getInfo();
  }
}