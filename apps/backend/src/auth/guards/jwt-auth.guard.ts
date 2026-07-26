import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Usage: @UseGuards(JwtAuthGuard) on any controller/route that needs a logged-in user.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
