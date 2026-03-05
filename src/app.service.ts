/**
 * Service sederhana untuk health check.
 * Pada aplikasi real, service ini biasanya berisi logic domain.
 */
import { Injectable } from '@nestjs/common';

// @Injectable menandai class ini sebagai provider yang bisa di-inject.
@Injectable()
export class AppService {
  // Contoh method business logic sederhana.
  getHello(): string {
    return 'Hello World!';
  }
}
