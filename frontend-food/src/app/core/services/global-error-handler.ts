import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | any): void {
    const logger = this.injector.get(LoggerService);

    // Extract error details
    const errorMessage = error?.message || 'Unknown error occurred';
    const errorStack = error?.stack || '';

    // Log the error
    logger.error(`Global Error: ${errorMessage}`, {
      message: errorMessage,
      stack: errorStack,
      context: 'GlobalErrorHandler',
      timestamp: new Date().toISOString(),
    });
  }
}
