// auth.service.ts (User)
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

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
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  // Observables for components
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  currentUser$ = this.userSubject.asObservable();

  constructor(private router: Router) {}

  // ========== PUBLIC API ==========

  // Get current login status
  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Get current user
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  // Get user token
  getToken(): string | null {
    return localStorage.getItem('user_token');
  }

  // Login user
  login(userData: User, token: string): void {
    // Store in localStorage
    localStorage.setItem('user_token', token);
    localStorage.setItem('user_id', userData._id);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    // Update BehaviorSubjects
    this.isLoggedInSubject.next(true);
    this.userSubject.next(userData);
  }

  // Register user (same as login)
  register(userData: User, token: string): void {
    this.login(userData, token);
  }

  // Logout user
  logout(): void {
    // Clear localStorage
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_data');
    
    // Update BehaviorSubjects
    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
    
    // Navigate to home
    this.router.navigate(['/']);
  }

  // Update user data (e.g., after profile update)
  updateUser(userData: User): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.userSubject.next(userData);
  }

  // Check if token exists (for auto-login on refresh)
  private hasToken(): boolean {
    return !!localStorage.getItem('user_token');
  }

  // Get user from localStorage
  private getUserFromStorage(): User | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  // Get user ID
  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  // Check if user has specific role (if you have roles)
  hasRole(role: string): boolean {
    const user = this.currentUser;
    // Assuming user has roles array, adjust based on your backend
    return user && (user as any).roles?.includes(role) || false;
  }
}