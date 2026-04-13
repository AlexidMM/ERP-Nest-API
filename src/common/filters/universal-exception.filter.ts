import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface UniversalErrorResponse {
  statusCode: number;
  intOpCode: string;
  data: {
    error: string;
  };
}

@Catch()
export class UniversalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<{ url?: string }>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception);
    const intOpCode = this.resolveIntOpCode(String(request?.url ?? ''), statusCode);

    const payload: UniversalErrorResponse = {
      statusCode,
      intOpCode,
      data: {
        error: message,
      },
    };

    response.status(statusCode).json(payload);
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse() as
        | { message?: string | string[] }
        | string;

      if (typeof response === 'string') {
        return response;
      }

      if (Array.isArray(response?.message)) {
        return response.message.join(', ');
      }

      if (typeof response?.message === 'string') {
        return response.message;
      }
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse() as
        | { message?: string | string[] }
        | string;

      if (typeof response === 'string') {
        return response;
      }

      if (Array.isArray(response?.message)) {
        return response.message.join(', ');
      }

      if (typeof response?.message === 'string') {
        return response.message;
      }

      return exception.message || 'Error de negocio';
    }

    return 'Error interno del servidor';
  }

  private resolveIntOpCode(url: string, statusCode: number): string {
    const normalizedUrl = String(url).toLowerCase();

    if (normalizedUrl.includes('/auth')) {
      return `US${statusCode}`;
    }

    if (normalizedUrl.includes('/users')) {
      return `US${statusCode}`;
    }

    if (normalizedUrl.includes('/groups')) {
      return `GR${statusCode}`;
    }

    if (normalizedUrl.includes('/tickets')) {
      return `TK${statusCode}`;
    }

    return `ERROR${statusCode}`;
  }
}
