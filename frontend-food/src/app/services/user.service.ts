import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:5000/api/v1/user'; // Adjust to your backend

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Login user
  loginUser(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials,{
      withCredentials:true
    });
  }

  // Register user
  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData,{
      withCredentials:true
    });
  }

  // Get user profile
  getProfile(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get(`${this.baseUrl}/profile`, { headers });
  }

  // Update user profile
  updateProfile(userData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.patch(`${this.baseUrl}/profile`, userData, { headers });
  }

  // Add other user-related methods...
}