// auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { RestaurantService } from './restaurant.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private restaurantIdSubject = new BehaviorSubject<string | null>(this.getRestaurantId());

  constructor(private router: Router,private RestaurantService:RestaurantService) {}

  // Get authentication status as observable
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Get current authentication status
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Get restaurant ID as observable
  get restaurantId$(): Observable<string | null> {
    return this.restaurantIdSubject.asObservable();
  }

  // Get current restaurant ID
  get restaurantId(): string | null {
    return this.restaurantIdSubject.value;
  }

  // Login restaurant
  login(restaurantData: any, token: string): void {
    localStorage.setItem('restaurant_token', token);
    localStorage.setItem('restaurant_id', restaurantData._id);
    localStorage.setItem('restaurant_data', JSON.stringify(restaurantData));
    
    this.isAuthenticatedSubject.next(true);
    this.restaurantIdSubject.next(restaurantData._id);
  }

  // Register restaurant (same as login)
  register(restaurantData: any, token: string): void {
    this.login(restaurantData, token);
  }

  // Logout restaurant
  logout(): void {
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_id');
    localStorage.removeItem('restaurant_data');
    
    this.isAuthenticatedSubject.next(false);
    this.restaurantIdSubject.next(null);
    
    this.router.navigate(['/restaurant/login']);
  }

  // Check if token exists
  private hasToken(): boolean {
    return !!localStorage.getItem('restaurant_token');
  }

  // Get restaurant ID from localStorage
  private getRestaurantId(): string | null {
    return localStorage.getItem('restaurant_id');
  }

  // Get restaurant token
  getToken(): string | null {
    return localStorage.getItem('restaurant_token');
  }

  // Get restaurant data
  getRestaurantData(): any {
    const data = localStorage.getItem('restaurant_data');
    return data ? JSON.parse(data) : null;
  }
}