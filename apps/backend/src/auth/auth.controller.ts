import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new client account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // NOTE: this guards the refresh endpoint with the *access-token* strategy for
  // simplicity in this scaffold. For production, add a separate JwtRefreshStrategy
  // that validates against JWT_REFRESH_SECRET, and check the refresh token against
  // an allowlist/blocklist table so tokens can be revoked on logout.
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exchange a valid token for a fresh access/refresh pair' })
  refresh(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return this.authService.refresh(user.userId, user.email, user.role);
  }
}
