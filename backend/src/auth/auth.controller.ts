import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Ip,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@ValidatedBody(RegisterDto) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // login rate limiting, per spec's security section
  login(@ValidatedBody(LoginDto) dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, { ipAddress: ip });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@ValidatedBody(RefreshDto) dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@ValidatedBody(RefreshDto) dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
