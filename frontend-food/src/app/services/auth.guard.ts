// auth.guard.ts (User)
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private logger = inject(LoggerService);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn;

    if (isLoggedIn) {
      this.logger.info('User route access granted');
      return true;
    }

    this.logger.warn('Unauthorized user route access — redirecting to login');

    this.router.navigate(['/login']);
    return false;
  }
}
