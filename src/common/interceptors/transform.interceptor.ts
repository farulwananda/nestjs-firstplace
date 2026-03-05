/**
 * Global response interceptor.
 * Semua response sukses dibungkus dalam shape standar: { statusCode, message, data }.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// Interceptor dieksekusi sebelum dan sesudah handler controller.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  // intercept() menerima context + stream response dari handler berikutnya.
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode: number = response.statusCode;

    // map() dipakai untuk mengubah data response tanpa mengubah business logic service.
    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
