import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';

import { validate } from './common/config/env.validation.js';
import { winstonConfig } from './common/logger/winston.config.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NotesModule } from './notes/notes.module.js';
import { MailModule } from './mail/mail.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env'],
    }),

    // Winston logging
    WinstonModule.forRoot(winstonConfig),

    // Rate limiting: 60 requests per minute per IP
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),

    // Database (Drizzle + MySQL)
    DatabaseModule,

    // Feature modules
    MailModule,
    AuthModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
