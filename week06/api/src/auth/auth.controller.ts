import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public } from './auth.guard.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 201 User (no password) — the default status for @Post
  @Public()
  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // 200 { token } — @Post defaults to 201, so the status is set back to 200
  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // 200 User — every route except register/login requires the token (guard)
  @Get('me')
  me(@CurrentUser() userId: number) {
    return this.auth.me(userId);
  }
}
