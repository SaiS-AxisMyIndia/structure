import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isPacket, Packet, packetBody } from './packet.js';

// Registered globally in main.ts - a controller normally just returns its
// plain result (see AuthController's routes) and gets wrapped in
// Packet.success(data) - httpStatus 200 - automatically. A controller that
// wants a different status/message can instead return a Packet directly
// (e.g. `Packet.success(user, 'Created', 201)`); this is what actually
// applies that status to the response, since returning a plain value from
// a Nest handler has no way to steer it otherwise.
@Injectable()
export class PacketInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Omit<Packet<unknown>, 'httpStatus'>> {
    return next.handle().pipe(
      map(data => {
        const packet = isPacket(data) ? data : Packet.success(data);
        context.switchToHttp().getResponse<Response>().status(packet.httpStatus);
        return packetBody(packet);
      }),
    );
  }
}
