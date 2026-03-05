/**
 * Helper untuk membangun koneksi Redis BullMQ dari env.
 * Mendukung dua mode: REDIS_URL atau host/port terpisah.
 */
import { ConfigService } from '@nestjs/config';
import type { ConnectionOptions } from 'bullmq';

export function buildBullConnection(
  configService: ConfigService,
): ConnectionOptions {
  // Mode 1: pakai REDIS_URL bila tersedia.
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    return { url: redisUrl };
  }

  // Mode 2: fallback ke host/port/db/password.
  return {
    host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
    port: configService.get<number>('REDIS_PORT') ?? 6379,
    db: configService.get<number>('REDIS_DB') ?? 0,
    password: configService.get<string>('REDIS_PASSWORD') ?? undefined,
  };
}
