import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';

import { buildBullConnection } from './mail-queue.config.js';
import { MAIL_JOB_SEND_WELCOME, MAIL_QUEUE_NAME } from './mail.constants.js';
import type { SendWelcomeEmailJob } from './interfaces/send-welcome-email-job.interface.js';
import { MailService } from './mail.service.js';

@Injectable()
export class MailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      MAIL_QUEUE_NAME,
      async (job: Job) => this.process(job),
      {
        connection: buildBullConnection(this.configService),
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Mail job failed: ${job?.name ?? 'unknown'}#${job?.id ?? 'unknown'}`,
        error.stack,
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error('Mail worker connection error', error.stack);
    });

    this.logger.log(`Worker listening: ${MAIL_QUEUE_NAME}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async process(job: Job): Promise<void> {
    switch (job.name) {
      case MAIL_JOB_SEND_WELCOME:
        await this.mailService.sendWelcomeEmail(
          job.data as SendWelcomeEmailJob,
        );
        return;
      default:
        this.logger.warn(`Unhandled mail job: ${job.name}`);
    }
  }
}
