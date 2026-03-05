/**
 * Passport strategy untuk verifikasi JWT bearer token.
 * Hasil validate() akan ditempel ke request.user.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
}

// Strategy provider yang otomatis didaftarkan Passport.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Constructor strategy dipakai untuk konfigurasi cara ekstrak + verifikasi token.
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Nilai return method validate menjadi request.user.
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
