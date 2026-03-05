/**
 * Passport strategy untuk OAuth Google.
 * Setelah Google mengembalikan profile, strategy ini memanggil AuthService
 * agar user di-find/create lalu menghasilkan access token.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OAuth2Strategy, type VerifyFunction } from 'passport-google-oauth';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';

// Provider strategy OAuth Google.
@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  // Constructor strategy: mengambil credential OAuth dari environment.
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    super({
      clientID: clientID ?? 'not-configured',
      clientSecret: clientSecret ?? 'not-configured',
      callbackURL:
        callbackURL ?? 'http://localhost:3000/api/v1/auth/google/callback',
    });
  }

  // Validate dipanggil Passport setelah Google mengembalikan profile.
  // done(null, user) menandakan autentikasi sukses.
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName: string;
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
    },
    done: VerifyFunction,
  ): Promise<void> {
    try {
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : '';

      const avatar =
        profile.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : undefined;

      const result = await this.authService.findOrCreateByGoogle({
        googleId: profile.id,
        email,
        name: profile.displayName,
        avatar,
      });

      done(null, result);
    } catch (error) {
      this.logger.error('Google OAuth validation failed', error);
      done(error as Error);
    }
  }
}
