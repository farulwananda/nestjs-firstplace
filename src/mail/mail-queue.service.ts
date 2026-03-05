/**
 * Queue producer untuk job email.
 * Service lain (contoh: AuthService) memanggil service ini untuk enqueue job.
 */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { buildBullConnection } from './mail-queue.config.js';
import { MAIL_JOB_SEND_WELCOME, MAIL_QUEUE_NAME } from './mail.constants.js';
import type { SendWelcomeEmailJob } from './interfaces/send-welcome-email-job.interface.js';

// Producer service untuk menambahkan job ke Redis queue.
@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private readonly queue: Queue;

  // Constructor membuat instance queue BullMQ.
  constructor(private readonly configService: ConfigService) {
    this.queue = new Queue(MAIL_QUEUE_NAME, {
      connection: buildBullConnection(this.configService),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      },
    });

    // Listener error koneksi queue.
    this.queue.on('error', (error) => {
      this.logger.error('Mail queue connection error', error.stack);
    });
  }

  // Hook lifecycle module: dipanggil saat module siap.
  onModuleInit(): void {
    this.logger.log(`Queue initialized: ${MAIL_QUEUE_NAME}`);
  }

  // Hook lifecycle module: close connection queue saat shutdown.
  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  // Method publik untuk enqueue welcome email.
  async enqueueWelcomeEmail(data: SendWelcomeEmailJob): Promise<string> {
    const job = await this.queue.add(MAIL_JOB_SEND_WELCOME, data);

    return String(job.id);
  }
}
