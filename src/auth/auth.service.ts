/**
 * Business logic autentikasi:
 * - register/login user lokal (email + password)
 * - generate JWT
 * - profile lookup
 * - login/link akun Google
 * - enqueue welcome email async
 */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '../database/database.module.js';
import * as schema from '../database/schema/index.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { MailQueueService } from '../mail/mail-queue.service.js';

// @Injectable membuat AuthService bisa dipakai lewat constructor injection.
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly logger = new Logger(AuthService.name);

  // Constructor injection untuk dependency eksternal service ini.
  constructor(
    // Token custom DRIZZLE dipakai untuk injeksi koneksi database.
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly mailQueueService: MailQueueService,
  ) {}

  // Register user lokal: validasi unik email, hash password, simpan user, buat token.
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    await this.db.insert(schema.users).values({
      email,
      password: hashedPassword,
      name,
    });

    // Fetch the created user
    const createdUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    const user = createdUsers[0];

    // Generate token
    const token = this.generateToken(user.id, user.email);
    // Queue email dikirim async agar response register tetap cepat.
    void this.enqueueWelcomeEmail(user.email, user.name);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // Login user lokal: cari user, verifikasi password, lalu issue JWT.
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const foundUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = foundUsers[0];

    // Check if user has a password (might be Google-only account)
    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google login. Please sign in with Google.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // Ambil profil user yang sedang login berdasarkan userId dari token.
  async getProfile(userId: string) {
    const foundUsers = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        avatar: schema.users.avatar,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    return foundUsers[0];
  }

  // Helper internal untuk menandatangani JWT dari payload user.
  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  // Workflow login Google:
  // 1) cek googleId, 2) jika tidak ada cek email untuk linking, 3) kalau belum ada buat user baru.
  async findOrCreateByGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    // Check by Google ID first
    const existingByGoogle = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, profile.googleId))
      .limit(1);

    if (existingByGoogle.length > 0) {
      const user = existingByGoogle[0];
      const token = this.generateToken(user.id, user.email);
      return {
        access_token: token,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }

    // Check by email (user registered manually, now linking Google)
    const existingByEmail = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, profile.email))
      .limit(1);

    if (existingByEmail.length > 0) {
      // Link Google account to existing user
      await this.db
        .update(schema.users)
        .set({
          googleId: profile.googleId,
          avatar: profile.avatar ?? existingByEmail[0].avatar,
        })
        .where(eq(schema.users.id, existingByEmail[0].id));

      const user = existingByEmail[0];
      const token = this.generateToken(user.id, user.email);
      return {
        access_token: token,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }

    // Create new user from Google profile
    await this.db.insert(schema.users).values({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatar: profile.avatar,
    });

    const createdUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, profile.googleId))
      .limit(1);

    const user = createdUsers[0];
    const token = this.generateToken(user.id, user.email);
    void this.enqueueWelcomeEmail(user.email, user.name);
    return {
      access_token: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // Queue producer dibungkus try/catch agar kegagalan Redis tidak memblokir auth flow.
  private async enqueueWelcomeEmail(
    email: string,
    name: string,
  ): Promise<void> {
    try {
      await this.mailQueueService.enqueueWelcomeEmail({
        to: email,
        name,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to enqueue welcome email for ${email}: ${reason}`,
      );
    }
  }
}
