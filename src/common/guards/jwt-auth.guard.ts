/**
 * Guard wrapper untuk strategy JWT.
 * Digunakan di endpoint private agar hanya request dengan token valid yang lolos.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Dengan extend AuthGuard('jwt'), guard ini otomatis memakai JwtStrategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
