import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  info(message: string, data?: unknown): void {
    if (!environment.production) {
      console.info('[INFO]:', message, data ?? '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (!environment.production) {
      console.warn('[WARN]:', message, data ?? '');
    }
  }

  error(message: string, error?: unknown): void {
    if (!environment.production) {
      console.error('[ERROR]:', message, error ?? '');
    }
  }
}
