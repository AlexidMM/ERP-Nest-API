import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseData<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ResponseData<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseData<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    // Mapear códigos de operación por módulo
    const mapIntOpCode = (module: string, status: number): string => {
      switch (true) {
        case module.includes('auth') && status === 201:
          return 'US201'; // User Created
        case module.includes('auth') && status === 200:
          return 'US200'; // User Authenticated
        case module.includes('users') && status === 201:
          return 'US201'; // User Created
        case module.includes('users') && status === 200:
          return 'US200'; // User Retrieved
        case module.includes('tickets') && status === 201:
          return 'TK201'; // Ticket Created
        case module.includes('tickets') && status === 200:
          return 'TK200'; // Ticket Retrieved
        case module.includes('groups') && status === 201:
          return 'GR201'; // Group Created
        case module.includes('groups') && status === 200:
          return 'GR200'; // Group Retrieved
        case status === 400:
          return 'ERROR400'; // Bad Request
        case status === 403:
          return 'ERROR403'; // Forbidden
        case status === 404:
          return 'ERROR404'; // Not Found
        case status === 500:
          return 'ERROR500'; // Internal Server Error
        default:
          return 'OK';
      }
    };

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode || 200,
        intOpCode: mapIntOpCode(context.switchToHttp().getRequest().url, statusCode),
        data: data || null,
      })),
    );
  }
}
