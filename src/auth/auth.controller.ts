/**
 * Layer HTTP untuk fitur auth.
 * Controller menerima request, validasi DTO (via global pipe), lalu delegasi ke AuthService.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

// Swagger grouping untuk endpoint auth.
@ApiTags('Auth')
// Prefix route untuk controller ini menjadi /auth.
@Controller('auth')
export class AuthController {
  // Service di-inject oleh Nest DI.
  constructor(private readonly authService: AuthService) {}

  // Endpoint POST /auth/register.
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  // @Body() mengikat payload JSON request ke DTO.
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Endpoint POST /auth/login.
  @Post('login')
  // Override status default POST (201) menjadi 200.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint GET /auth/profile yang butuh JWT valid.
  @Get('profile')
  // @UseGuards menjalankan guard sebelum method controller dieksekusi.
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @CurrentUser('id') mengambil field id dari request.user.
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // Endpoint pemicu redirect OAuth ke Google consent screen.
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  googleLogin(): void {
    // Passport redirects to Google consent screen
    // Scope is configured in GoogleStrategy
  }

  // Callback endpoint setelah user selesai login di Google.
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth login successful' })
  // Request.user diisi oleh strategy ketika autentikasi sukses.
  googleCallback(@Req() req: Request) {
    return req.user;
  }
}
