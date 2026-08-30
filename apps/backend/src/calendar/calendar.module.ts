import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarGenerationController } from './calendar-generation.controller';
import { CalendarService } from './calendar.service';
import { CustomerProfileModule } from '../settings/customer-profile/customer-profile.module';
import { ContentSuggestionsModule } from '../content-suggestions/content-suggestions.module';

@Module({
  imports: [CustomerProfileModule, ContentSuggestionsModule],
  controllers: [CalendarController, CalendarGenerationController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
