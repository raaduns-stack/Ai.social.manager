import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignTicketDto {
  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;
}
