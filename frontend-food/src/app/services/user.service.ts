import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  private baseUrl = 'http://localhost:5000/api/v1/user';

  // ✅ LOGIN USER
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    this.logger.info('Login API called', { email: credentials.email });

    return this.http
      .post(`${this.baseUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => {
            this.logger.info('Login API success', { email: credentials.email });
          },
          error: (error) => {
            this.logger.error('Login API failed', {
              email: credentials.email,
              status: error?.status,
            });
          },
        }),
      );
  }

  // ✅ REGISTER USER
  registerUser(userData: any): Observable<any> {
    this.logger.info('Register API called', { email: userData?.email });

    return this.http
      .post(`${this.baseUrl}/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => {
            this.logger.info('Register API success', { email: userData?.email });
          },
          error: (error) => {
            this.logger.error('Register API failed', {
              email: userData?.email,
              status: error?.status,
            });
          },
        }),
      );
  }

  // ✅ GET USER PROFILE
  getProfile(): Observable<any> {
    const token = this.authService.getToken();

    this.logger.info('Profile API called');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.baseUrl}/profile`, { headers }).pipe(
      tap({
        next: () => {
          this.logger.info('Profile API success');
        },
        error: (error) => {
          this.logger.error('Profile API failed', { status: error?.status });
        },
      }),
    );
  }

  // ✅ UPDATE USER PROFILE
  updateProfile(userData: any): Observable<any> {
    const token = this.authService.getToken();

    this.logger.info('Update profile API called');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.patch(`${this.baseUrl}/profile`, userData, { headers }).pipe(
      tap({
        next: () => {
          this.logger.info('Update profile API success');
        },
        error: (error) => {
          this.logger.error('Update profile API failed', { status: error?.status });
        },
      }),
    );
  }
}
