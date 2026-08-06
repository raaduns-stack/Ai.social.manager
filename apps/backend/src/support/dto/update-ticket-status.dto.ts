import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'], {
    message: 'Status must be open, in_progress, resolved, or closed',
  })
  @IsNotEmpty()
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}
