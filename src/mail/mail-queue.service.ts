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

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private readonly queue: Queue;

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

    this.queue.on('error', (error) => {
      this.logger.error('Mail queue connection error', error.stack);
    });
  }

  onModuleInit(): void {
    this.logger.log(`Queue initialized: ${MAIL_QUEUE_NAME}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async enqueueWelcomeEmail(data: SendWelcomeEmailJob): Promise<string> {
    const job = await this.queue.add(MAIL_JOB_SEND_WELCOME, data);

    return String(job.id);
  }
}
