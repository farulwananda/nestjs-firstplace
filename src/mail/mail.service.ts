/**
 * Service pengiriman email via SMTP (Mailtrap).
 * Dipanggil worker saat job email diproses.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

import type { SendWelcomeEmailJob } from './interfaces/send-welcome-email-job.interface.js';

// Service pengiriman SMTP.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromEmail: string;

  // Constructor membaca konfigurasi SMTP dan membuat transporter jika kredensial lengkap.
  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAILTRAP_HOST');
    const port = this.configService.get<number>('MAILTRAP_PORT') ?? 2525;
    const user = this.configService.get<string>('MAILTRAP_USER');
    const pass = this.configService.get<string>('MAILTRAP_PASSWORD');

    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') ?? 'noreply@firstplace.local';

    // Jika env belum lengkap, service tetap hidup tapi pengiriman email di-skip.
    if (!host || !user || !pass) {
      this.transporter = null;
      this.logger.warn(
        'Mailtrap credentials are incomplete. Email delivery is disabled.',
      );
      return;
    }

    // createTransport() adalah client SMTP yang dipakai untuk sendMail().
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Template-level method untuk welcome email.
  async sendWelcomeEmail(payload: SendWelcomeEmailJob): Promise<void> {
    await this.sendEmail({
      to: payload.to,
      subject: 'Welcome to NestJS Firstplace',
      text: `Hi ${payload.name}, your account is ready. Happy writing!`,
      html: `<p>Hi <strong>${payload.name}</strong>, your account is ready.</p><p>Happy writing!</p>`,
    });
  }

  // Low-level helper untuk kirim email generik.
  private async sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Email skipped because transporter is not configured: ${input.to}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    this.logger.log(`Email sent to ${input.to}`);
  }
}
