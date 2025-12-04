// auth.restaurant.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestaurantService } from './restaurant.service';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private logger = inject(LoggerService);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private restaurantIdSubject = new BehaviorSubject<string | null>(this.getRestaurantId());

  constructor(
    private router: Router,
    private RestaurantService: RestaurantService,
  ) {
    this.logger.info('Restaurant AuthService initialized', {
      isAuthenticated: this.isAuthenticatedSubject.value,
    });
  }

  // ✅ AUTH STATUS OBSERVABLE
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // ✅ RESTAURANT ID
  get restaurantId$(): Observable<string | null> {
    return this.restaurantIdSubject.asObservable();
  }

  get restaurantId(): string | null {
    return this.restaurantIdSubject.value;
  }

  // ✅ LOGIN
  login(restaurantData: any, token: string): void {
    localStorage.setItem('restaurant_token', token);
    localStorage.setItem('restaurant_id', restaurantData._id);
    localStorage.setItem('restaurant_data', JSON.stringify(restaurantData));

    this.isAuthenticatedSubject.next(true);
    this.restaurantIdSubject.next(restaurantData._id);

    this.logger.info('Restaurant login successful', {
      restaurantId: restaurantData._id,
    });
  }

  // ✅ REGISTER = LOGIN
  register(restaurantData: any, token: string): void {
    this.logger.info('Restaurant registration completed');
    this.login(restaurantData, token);
  }

  // ✅ LOGOUT
  logout(): void {
    const id = this.restaurantId;

    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_id');
    localStorage.removeItem('restaurant_data');

    this.isAuthenticatedSubject.next(false);
    this.restaurantIdSubject.next(null);

    this.logger.warn('Restaurant logged out', {
      restaurantId: id,
    });

    this.router.navigate(['/restaurant/login']);
  }

  // ✅ TOKEN CHECK
  private hasToken(): boolean {
    const hasToken = !!localStorage.getItem('restaurant_token');

    if (!hasToken) {
      this.logger.warn('Restaurant token missing');
    }

    return hasToken;
  }

  // ✅ GET RESTAURANT ID
  private getRestaurantId(): string | null {
    try {
      return localStorage.getItem('restaurant_id');
    } catch (err) {
      this.logger.error('Failed to read restaurant_id from storage');
      return null;
    }
  }

  // ✅ GET TOKEN
  getToken(): string | null {
    return localStorage.getItem('restaurant_token');
  }

  // ✅ GET RESTAURANT DATA
  getRestaurantData(): any {
    try {
      const data = localStorage.getItem('restaurant_data');
      return data ? JSON.parse(data) : null;
    } catch (err) {
      this.logger.error('Corrupt restaurant_data in localStorage');
      return null;
    }
  }
}
