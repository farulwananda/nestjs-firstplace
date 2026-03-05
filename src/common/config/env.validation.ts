/**
 * Validasi environment variables saat aplikasi startup.
 * Jika ada env wajib yang salah/missing, app akan fail fast.
 */
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Class ini dipakai class-validator sebagai schema validasi env.
class EnvironmentVariables {
  // NODE_ENV wajib salah satu dari enum Environment.
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(8)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(1)
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @MinLength(1)
  REDIS_HOST: string = '127.0.0.1';

  @IsNumber()
  REDIS_PORT: number = 6379;

  @IsNumber()
  REDIS_DB: number = 0;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  @MinLength(1)
  MAILTRAP_HOST: string = 'sandbox.smtp.mailtrap.io';

  @IsNumber()
  MAILTRAP_PORT: number = 2525;

  @IsString()
  @IsOptional()
  MAILTRAP_USER?: string;

  @IsString()
  @IsOptional()
  MAILTRAP_PASSWORD?: string;

  @IsString()
  @MinLength(1)
  MAIL_FROM: string = 'noreply@firstplace.local';

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;
}

// Dipanggil otomatis oleh ConfigModule.forRoot({ validate }).
// Jika ada error, throw agar aplikasi gagal start (fail fast).
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error:\n${errors.toString()}`);
  }

  return validatedConfig;
}
