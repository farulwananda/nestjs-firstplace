/**
 * Module auth.
 * Bertugas mendaftarkan komponen autentikasi: controller, service, JWT, dan strategy.
 */
import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { MailModule } from '../mail/mail.module.js';

// Module auth mendaftarkan semua dependency yang dibutuhkan fitur login/register.
@Module({
  imports: [
    // MailModule di-import agar AuthService bisa enqueue welcome email.
    MailModule,
    // PassportModule menyiapkan mekanisme strategy-based authentication.
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule dipasang async supaya secret bisa dibaca dari ConfigService.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') ?? '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
