/**
 * BullMQ worker (consumer) untuk memproses job email dari Redis queue.
 * Worker ini berjalan di proses Nest yang sama dan memanggil MailService.
 */
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

// Consumer worker untuk memproses job dari queue mail.
@Injectable()
export class MailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorker.name);
  private worker: Worker | null = null;

  // Inject config + MailService yang akan dipanggil saat job diproses.
  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // Saat module init, mulai listen queue menggunakan Worker BullMQ.
  onModuleInit(): void {
    this.worker = new Worker(
      MAIL_QUEUE_NAME,
      // Setiap job akan diarahkan ke method process().
      async (job: Job) => this.process(job),
      {
        connection: buildBullConnection(this.configService),
        concurrency: 5,
      },
    );

    // Event saat job gagal setelah retry.
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Mail job failed: ${job?.name ?? 'unknown'}#${job?.id ?? 'unknown'}`,
        error.stack,
      );
    });

    // Event error koneksi worker.
    this.worker.on('error', (error) => {
      this.logger.error('Mail worker connection error', error.stack);
    });

    this.logger.log(`Worker listening: ${MAIL_QUEUE_NAME}`);
  }

  // Tutup worker saat aplikasi shutdown agar graceful.
  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  // Router job name -> handler function.
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
