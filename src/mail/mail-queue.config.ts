import { ConfigService } from '@nestjs/config';
import type { ConnectionOptions } from 'bullmq';

export function buildBullConnection(
  configService: ConfigService,
): ConnectionOptions {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    return { url: redisUrl };
  }

  return {
    host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
    port: configService.get<number>('REDIS_PORT') ?? 6379,
    db: configService.get<number>('REDIS_DB') ?? 0,
    password: configService.get<string>('REDIS_PASSWORD') ?? undefined,
  };
}
