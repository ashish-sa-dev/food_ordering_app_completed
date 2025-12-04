import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  private baseUrl = 'http://localhost:5000/api/v1/user';

  // ✅ POPULAR RESTAURANTS
  getPopular(): Observable<any> {
    this.logger.info('Fetching popular restaurants');

    return this.http.get(`${this.baseUrl}/popularRestaurant`).pipe(
      tap({
        next: () => this.logger.info('Popular restaurants fetched'),
        error: (error) =>
          this.logger.error('Failed to fetch popular restaurants', { status: error?.status }),
      }),
    );
  }

  // ✅ NEARBY RESTAURANTS
  getNearby(): Observable<any> {
    this.logger.info('Fetching nearby restaurants');

    const token = localStorage.getItem('user_token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });

    return this.http
      .get(`${this.baseUrl}/nearby`, {
        headers,
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Nearby restaurants fetched'),
          error: (error) =>
            this.logger.error('Failed to fetch nearby restaurants', { status: error?.status }),
        }),
      );
  }

  // ✅ SEARCH RESTAURANTS
  searchRestaurants(query: string): Observable<any> {
    this.logger.info('Restaurant search', { query });

    return this.http.get(`${this.baseUrl}/search?query=${query}`).pipe(
      tap({
        next: () => this.logger.info('Restaurant search success'),
        error: (error) => this.logger.error('Restaurant search failed', { status: error?.status }),
      }),
    );
  }

  // ✅ GET RESTAURANT BY ID
  getRestaurantById(id: string): Observable<any> {
    this.logger.info('Fetching restaurant by ID', { id });

    return this.http.get(`http://localhost:5000/api/v1/restaurant/${id}`).pipe(
      tap({
        next: () => this.logger.info('Restaurant details fetched', { id }),
        error: (error) =>
          this.logger.error('Failed to fetch restaurant details', {
            id,
            status: error?.status,
          }),
      }),
    );
  }

  // ✅ REGISTER RESTAURANT
  registerRestaurant(formData: FormData): Observable<any> {
    this.logger.info('Restaurant registration started');

    return this.http
      .post('http://localhost:5000/api/v1/restaurant/register', formData, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant registration success'),
          error: (error) =>
            this.logger.error('Restaurant registration failed', { status: error?.status }),
        }),
      );
  }

  // ✅ RESTAURANT LOGIN
  loginRestaurant(credentials: { email: string; password: string }): Observable<any> {
    this.logger.info('Restaurant login API called', { email: credentials.email });

    return this.http
      .post('http://localhost:5000/api/v1/restaurant/login', credentials, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant login success', { email: credentials.email }),
          error: (error) =>
            this.logger.error('Restaurant login failed', {
              email: credentials.email,
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ RESTAURANT PROFILE
  getProfile(): Observable<any> {
    this.logger.info('Fetching restaurant profile');

    return this.http
      .get('http://localhost:5000/api/v1/restaurant/profile', {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant profile fetched'),
          error: (error) =>
            this.logger.error('Failed to fetch restaurant profile', {
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ ADD MENU ITEM
  addMenuItem(formData: FormData): Observable<any> {
    this.logger.info('Adding menu item');

    return this.http
      .post('http://localhost:5000/api/v1/restaurant/add/menuItem', formData, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Menu item added'),
          error: (error) =>
            this.logger.error('Failed to add menu item', {
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ GET MENU ITEMS
  getMenuItems(): Observable<any> {
    this.logger.info('Fetching menu items');

    return this.http
      .get('http://localhost:5000/api/v1/restaurant/get/menuItems', {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Menu items fetched'),
          error: (error) =>
            this.logger.error('Failed to fetch menu items', { status: error?.status }),
        }),
      );
  }

  // ✅ UPDATE MENU AVAILABILITY
  updateMenuItemAvailability(itemId: string, isAvailable: boolean): Observable<any> {
    this.logger.info('Updating menu availability', { itemId, isAvailable });

    return this.http
      .patch(
        `http://localhost:5000/api/v1/restaurant/update/menuItem/${itemId}`,
        { isAvailable },
        { withCredentials: true },
      )
      .pipe(
        tap({
          next: () => this.logger.info('Menu availability updated', { itemId }),
          error: (error) =>
            this.logger.error('Failed to update menu availability', {
              itemId,
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ DELETE MENU ITEM
  deleteMenuItem(itemId: string): Observable<any> {
    this.logger.info('Deleting menu item', { itemId });

    return this.http
      .delete(`http://localhost:5000/api/v1/restaurant/delete/menuItem/${itemId}`, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Menu item deleted', { itemId }),
          error: (error) =>
            this.logger.error('Failed to delete menu item', {
              itemId,
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ LOGOUT RESTAURANT
  logoutRestaurant(): Observable<any> {
    this.logger.info('Restaurant logout API called');

    return this.http
      .post('http://localhost:5000/api/v1/restaurant/logout', {}, { withCredentials: true })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant logout success'),
          error: (error) =>
            this.logger.error('Restaurant logout failed', { status: error?.status }),
        }),
      );
  }

  // ✅ GET RESTAURANT ORDERS
  getRestaurantOrders(): Observable<any> {
    this.logger.info('Fetching restaurant orders');

    const token = localStorage.getItem('restaurant_token');

    return this.http
      .get(`http://localhost:5000/api/v1/restaurant/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant orders fetched'),
          error: (error) =>
            this.logger.error('Failed to fetch restaurant orders', {
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ GET ORDERS BY STATUS
  getOrdersByStatus(status: string): Observable<any> {
    this.logger.info('Fetching orders by status', { status });

    const token = localStorage.getItem('restaurant_token');

    return this.http
      .get(`http://localhost:5000/api/v1/restaurant/orders/status/${status}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Orders by status fetched', { status }),
          error: (error) =>
            this.logger.error('Failed to fetch orders by status', {
              status,
              errorCode: error?.status,
            }),
        }),
      );
  }

  // ✅ GET ORDER COUNTS
  getOrderCounts(): Observable<any> {
    this.logger.info('Fetching restaurant order counts');

    const token = localStorage.getItem('restaurant_token');

    return this.http
      .get(`http://localhost:5000/api/v1/restaurant/orders/counts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => this.logger.info('Restaurant order counts fetched'),
          error: (error) =>
            this.logger.error('Failed to fetch order counts', {
              status: error?.status,
            }),
        }),
      );
  }

  // ✅ UPDATE ORDER STATUS
  updateOrderStatus(orderId: string, status: string): Observable<any> {
    this.logger.info('Updating order status', { orderId, status });

    const token = localStorage.getItem('restaurant_token');

    return this.http
      .put(
        `http://localhost:5000/api/v1/restaurant/orders/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      )
      .pipe(
        tap({
          next: () => this.logger.info('Order status updated', { orderId, status }),
          error: (error) =>
            this.logger.error('Failed to update order status', {
              orderId,
              status,
              errorCode: error?.status,
            }),
        }),
      );
  }
}
