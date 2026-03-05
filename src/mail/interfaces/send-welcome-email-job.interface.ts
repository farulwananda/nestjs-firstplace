/**
 * Kontrak data job untuk welcome email.
 * Type ini memastikan payload queue konsisten dari producer ke worker.
 */
export interface SendWelcomeEmailJob {
  // Email penerima.
  to: string;
  // Nama user yang dipakai pada template isi email.
  name: string;
}
