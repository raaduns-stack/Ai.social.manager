import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { MailerService } from './mailer/mailer.service';
import { ContactDto } from './common/dto/contact.dto';

// Groups this controller under the "root" section in Swagger
@ApiTags('root')

// Defines the root route ("/")
@Controller()
export class AppController {
  // Inject services
  constructor(
    private readonly appService: AppService,
    private readonly mailerService: MailerService,
  ) { }

  // Handles GET requests to the root endpoint
  @Get()
  getInfo() {
    // Return the application information from the service
    return this.appService.getInfo();
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit the contact form and send email to support' })
  async submitContactForm(@Body() dto: ContactDto) {
    await this.mailerService.sendContactFormEmail(dto.name, dto.email, dto.company || '', dto.message);
    return { success: true, message: 'Message sent successfully.' };
  }
}