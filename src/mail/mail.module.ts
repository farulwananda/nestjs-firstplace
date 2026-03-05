/**
 * Module untuk sistem email async.
 * Menggabungkan producer queue, worker processor, dan service pengirim email.
 */
import { Module } from '@nestjs/common';

import { MailQueueService } from './mail-queue.service.js';
import { MailService } from './mail.service.js';
import { MailWorker } from './mail.worker.js';

// Module metadata untuk feature mail async.
@Module({
  providers: [MailService, MailQueueService, MailWorker],
  exports: [MailQueueService],
})
export class MailModule {}
