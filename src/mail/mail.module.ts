import { Module } from '@nestjs/common';

import { MailQueueService } from './mail-queue.service.js';
import { MailService } from './mail.service.js';
import { MailWorker } from './mail.worker.js';

@Module({
  providers: [MailService, MailQueueService, MailWorker],
  exports: [MailQueueService],
})
export class MailModule {}
