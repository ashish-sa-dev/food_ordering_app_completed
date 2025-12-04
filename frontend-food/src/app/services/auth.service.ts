// auth.service.ts (User)
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from '../core/services/logger.service';

export interface User {
  _id: string;
  fullname: string;
  email: string;
  phone?: string;
  address?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private logger = inject(LoggerService);

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  // Observables for components
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  currentUser$ = this.userSubject.asObservable();

  // ========== PUBLIC API ==========

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('user_token');
  }

  // ✅ LOGIN with logging
  login(userData: User, token: string): void {
    // ✅ NEVER log token or password
    this.logger.info('User login successful', {
      userId: userData._id,
      email: userData.email,
    });

    localStorage.setItem('user_token', token);
    localStorage.setItem('user_id', userData._id);
    localStorage.setItem('user_data', JSON.stringify(userData));

    this.isLoggedInSubject.next(true);
    this.userSubject.next(userData);
  }

  // ✅ Register uses login internally
  register(userData: User, token: string): void {
    this.logger.info('User registered and logged in', {
      userId: userData._id,
      email: userData.email,
    });

    this.login(userData, token);
  }

  // ✅ LOGOUT with logging
  logout(): void {
    const user = this.currentUser;

    this.logger.info('User logout', {
      userId: user?._id,
      email: user?.email,
    });

    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_data');

    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);

    this.router.navigate(['/']);
  }

  // ✅ USER PROFILE UPDATE
  updateUser(userData: User): void {
    this.logger.info('User profile updated', {
      userId: userData._id,
      email: userData.email,
    });

    localStorage.setItem('user_data', JSON.stringify(userData));
    this.userSubject.next(userData);
  }

  // ========== PRIVATE HELPERS ==========

  private hasToken(): boolean {
    return !!localStorage.getItem('user_token');
  }

  private getUserFromStorage(): User | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  hasRole(role: string): boolean {
    const user = this.currentUser;
    return (user && (user as any).roles?.includes(role)) || false;
  }
}
