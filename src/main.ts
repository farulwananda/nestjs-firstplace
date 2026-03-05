/**
 * Entry point aplikasi NestJS.
 * File ini menjalankan proses bootstrap:
 * - buat instance app
 * - pasang middleware/guard global
 * - aktifkan Swagger
 * - listen ke port
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, type LoggerService } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

// Fungsi bootstrap adalah lifecycle startup utama aplikasi NestJS.
async function bootstrap() {
  // NestFactory.create() membangun IoC container + module graph dari AppModule.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston as the NestJS logger
  const winstonLogger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGIN ?? '')
        : '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(
    new HttpExceptionFilter(app.get('WINSTON_MODULE_PROVIDER')),
  );

  // Global response transform
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Notes API')
    .setDescription('Production-grade REST API with Auth & Notes')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  winstonLogger.log(
    `🚀 Application running on http://localhost:${String(port)}`,
    'Bootstrap',
  );
  winstonLogger.log(
    `📚 Swagger docs at http://localhost:${String(port)}/api/docs`,
    'Bootstrap',
  );
}

// Menjalankan startup async tanpa top-level await.
void bootstrap();
