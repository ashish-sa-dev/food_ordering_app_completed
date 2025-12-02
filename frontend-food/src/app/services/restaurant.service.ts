import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { AuthService } from './auth.restaurant.service';

@Injectable({
    providedIn: 'root'
  })
export class RestaurantService {

  private baseUrl = 'http://localhost:5000/api/v1/user';

  constructor(private http: HttpClient,) {}

  getPopular(): Observable<any> {
    return this.http.get(`${this.baseUrl}/popularRestaurant`);
  }

  getNearby(): Observable<any> {
    // Get token from localStorage
    const token = localStorage.getItem('user_token');
    
    // Create headers
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  
    return this.http.get(`${this.baseUrl}/nearby`, {
      headers: headers,
      withCredentials: true
    });
  }

  searchRestaurants(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/search?query=${query}`);
  }

   getRestaurantById(id: string) {
    return this.http.get(`http://localhost:5000/api/v1/restaurant/${id}`);
  }

  registerRestaurant(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:5000/api/v1/restaurant/register', formData, {
      withCredentials: true
    });
  }
  loginRestaurant(credentials: {email: string, password: string}):Observable<any>{
    return this.http.post('http://localhost:5000/api/v1/restaurant/login', credentials, {
      withCredentials: true
    });
  }
  getProfile():Observable<any>{
    return this.http.get('http://localhost:5000/api/v1/restaurant/profile',{
      withCredentials:true
    })
  }
  addMenuItem(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:5000/api/v1/restaurant/add/menuItem', formData, {
      withCredentials: true
    });
  }
  getMenuItems(): Observable<any> {
    return this.http.get('http://localhost:5000/api/v1/restaurant/get/menuItems', {
      withCredentials: true
    });
  }
  updateMenuItemAvailability(itemId: string, isAvailable: boolean): Observable<any> {
    return this.http.patch(`http://localhost:5000/api/v1/restaurant/update/menuItem/${itemId}`, { isAvailable }, {
      withCredentials: true
    });
  }
  deleteMenuItem(itemId: string): Observable<any> {
    return this.http.delete(`http://localhost:5000/api/v1/restaurant/delete/menuItem/${itemId}`, {
      withCredentials: true
    });
  }
  logoutRestaurant(): Observable<any> {
    return this.http.post('http://localhost:5000/api/v1/restaurant/logout', {}, {
      withCredentials: true
    });
  }

  getRestaurantOrders(): Observable<any> {
    const token = localStorage.getItem('restaurant_token');
    return this.http.get(`http://localhost:5000/api/v1/restaurant/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
  } 

  getOrdersByStatus(status: string): Observable<any> {
    const token = localStorage.getItem('restaurant_token');
    return this.http.get(`http://localhost:5000/api/v1/restaurant/orders/status/${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
  }

  getOrderCounts(): Observable<any> {
    const token = localStorage.getItem('restaurant_token');
    return this.http.get(`http://localhost:5000/api/v1/restaurant/orders/counts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    const token = localStorage.getItem('restaurant_token');
    return this.http.put(`http://localhost:5000/api/v1/restaurant/orders/${orderId}/status`, 
      { status },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
  }

}
