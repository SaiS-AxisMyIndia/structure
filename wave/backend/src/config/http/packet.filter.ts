import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Packet, packetBody } from './packet.js';

// Registered globally in main.ts - catches everything a guard/pipe/service
// throws (an HttpException raised deliberately - UnauthorizedException,
// class-validator's own BadRequestException, ... - or anything else that
// slips through) and sends it back shaped as Packet.failed(...) instead of
// Nest's own default `{ statusCode, message, error }` error body, which the
// frontend's SecureCall doesn't know how to read (see packet.ts).
//
// The real HTTP status code is preserved (not flattened to 200) - the
// frontend's own token-refresh flow (see secure_call.ts's `request()`)
// depends on a real 401 to know when to refresh, the same way any other
// HTTP client/proxy/log would.
@Catch()
export class PacketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      // Not a deliberate HttpException - an actual bug. Nest's default
      // filter would have logged this too; still worth keeping now that
      // this filter replaces it.
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const packet = Packet.failed(this.extractMessage(exception), status, status);
    response.status(packet.httpStatus).json(packetBody(packet));
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return body;
      }
      if (body && typeof body === 'object') {
        // class-validator's ValidationPipe throws a BadRequestException
        // whose `message` is an array of per-field errors, not a string.
        const message = (body as { message?: string | string[] }).message;
        if (Array.isArray(message)) {
          return message.join(', ');
        }
        if (typeof message === 'string') {
          return message;
        }
      }
      return exception.message;
    }
    return exception instanceof Error ? exception.message : 'Something went wrong.';
  }
}
