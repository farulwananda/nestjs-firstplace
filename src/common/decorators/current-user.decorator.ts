/**
 * Custom decorator @CurrentUser().
 * Memudahkan akses request.user di controller tanpa baca object request manual.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// createParamDecorator membuat decorator parameter custom untuk controller method.
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // ExecutionContext memberi akses ke request/response layer aktif.
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    // Kalau belum ada user (mis. guard tidak jalan), kembalikan undefined.
    if (!user) return undefined;

    // Jika data diisi (contoh 'id'), ambil field spesifik. Jika tidak, kembalikan objek user.
    return data ? user[data] : user;
  },
);
