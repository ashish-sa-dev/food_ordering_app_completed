// auth.restaurant.guard.ts
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.restaurant.service';
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
    const isAuth = this.authService.isAuthenticated;

    if (isAuth) {
      this.logger.info('Restaurant route access granted');
      return true;
    }

    this.logger.warn('Unauthorized restaurant route access — redirecting to login');

    this.router.navigate(['/restaurant/login']);
    return false;
  }
}
