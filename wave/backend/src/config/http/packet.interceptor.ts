import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { finalizeResponse, isFinalResponse, Packet } from './packet.js';

@Injectable()
export class PacketInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => {
        const response = isFinalResponse(data) ? data : Packet.success(data);
        const { body, httpStatus } = finalizeResponse(response);
        context.switchToHttp().getResponse<Response>().status(httpStatus);
        return body;
      }),
    );
  }
}
