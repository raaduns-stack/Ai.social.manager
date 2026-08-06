import { Module } from '@nestjs/common';

import { ContentSuggestionsController } from './content-suggestions.controller';
import { ContentSuggestionsService } from './content-suggestions.service';
/**
 * Feature module responsible for orchestrating content suggestion functionalities,
 * including caption/idea generation endpoints and feedback tracking.
 */
@Module({
  controllers: [ContentSuggestionsController],
  providers: [ContentSuggestionsService],
})
export class ContentSuggestionsModule {}