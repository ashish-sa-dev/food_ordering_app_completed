import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../components/navbar/navbar'; // Adjust path as needed

@Component({
  selector: 'app-orders',
  imports: [CommonModule, Navbar],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  orders: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    const token = localStorage.getItem('user_token');

    this.http
      .get<any>('http://localhost:5000/api/v1/order/my-orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          this.orders = response.orders || response;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load orders';
          this.isLoading = false;
        },
      });
  }

  getStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      'out for delivery': 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      pending: '⏳',
      preparing: '👨‍🍳',
      'out for delivery': '🛵',
      delivered: '✅',
      cancelled: '❌',
    };
    return iconMap[status.toLowerCase()] || '📦';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTotalItems(order: any): number {
    return order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  }
}
