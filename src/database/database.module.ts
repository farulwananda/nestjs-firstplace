/**
 * Global database module.
 * Menyediakan provider DRIZZLE agar service lain bisa inject koneksi DB lewat DI.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema/index.js';

// Symbol token supaya provider DB bisa di-inject tanpa bentrok nama class.
export const DRIZZLE = Symbol('DRIZZLE');

// @Global artinya export provider module ini tersedia lintas module tanpa import berulang.
@Global()
@Module({
  providers: [
    {
      // Token provider yang akan di-inject ke service lain.
      provide: DRIZZLE,
      inject: [ConfigService],
      // Factory async untuk membuat koneksi DB saat startup.
      useFactory: async (configService: ConfigService) => {
        const connection = await mysql.createConnection(
          configService.getOrThrow<string>('DATABASE_URL'),
        );

        // drizzle(connection, { schema }) menghasilkan query builder type-safe.
        return drizzle(connection, { schema, mode: 'default' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
