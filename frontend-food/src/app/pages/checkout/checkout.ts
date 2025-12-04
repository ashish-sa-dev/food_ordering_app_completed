import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule], // Add FormsModule for ngModel
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private cartService = inject(CartService);
  private http = inject(HttpClient);
  public router = inject(Router);
  private logger = inject(LoggerService);

  checkoutData: any;
  paymentMethod: string = 'online'; // default payment method
  selectedAddress: any = null;
  userAddresses: any[] = [];
  userData: any = null;

  ngOnInit(): void {
    this.logger.info('Checkout page loaded', { timestamp: new Date().toISOString() });
    this.loadUserData();
    this.checkoutData = this.cartService.getCheckoutData();

    if (!this.checkoutData) {
      this.logger.warn('No checkout data available, redirecting to cart');
      this.router.navigate(['/cart']);
      return;
    }
  }

  loadUserData(): void {
    try {
      // Get user data from localStorage
      const userString = localStorage.getItem('user_data');
      if (userString) {
        this.userData = JSON.parse(userString);
        this.userAddresses = this.userData?.address || [];
        this.logger.info('User data loaded', {
          addressCount: this.userAddresses.length,
        });

        // Select first address by default if available
        if (this.userAddresses.length > 0) {
          this.selectedAddress = this.userAddresses[0];
        }
      }
    } catch (error) {
      this.logger.error('Error loading user data', { error });
    }
  }

  placeOrder(): void {
    if (!this.selectedAddress) {
      this.logger.warn('Order placement attempted without address selection');
      alert('Please select a delivery address');
      return;
    }

    this.logger.info('Placing order', {
      restaurantId: this.checkoutData.restaurantId,
      itemCount: this.checkoutData.items.length,
      totalAmount: this.checkoutData.total,
      paymentMethod: this.paymentMethod,
    });

    // Prepare delivery address in required format
    const deliveryAddress = {
      street: this.selectedAddress.street,
      city: this.selectedAddress.city,
      state: this.selectedAddress.state,
      pincode: this.selectedAddress.pincode,
    };

    const payload = {
      restaurant: this.checkoutData.restaurantId,
      items: this.checkoutData.items,
      deliveryAddress: deliveryAddress,
      paymentMethod: this.paymentMethod,
      totalAmount: this.checkoutData.total,
    };

    // Get token for authorization
    const token = localStorage.getItem('user_token');

    this.http
      .post('http://localhost:5000/api/v1/order/place', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .subscribe({
        next: (res: any) => {
          this.logger.info('Order placed successfully', { orderId: res.order?._id });
          alert('Order placed successfully!');
          this.cartService.clearCart();

          // Redirect based on payment method
          if (this.paymentMethod === 'online') {
            // If online payment, redirect to payment gateway or show payment UI
            this.processOnlinePayment(res.order);
          } else {
            // For offline payment, redirect to orders page
            this.router.navigate(['/orders']);
          }
        },
        error: (err) => {
          this.logger.error('Order placement failed', { error: err.error?.message });
          alert(err.error?.message || 'Something went wrong while placing the order.');
        },
      });
  }

  processOnlinePayment(order: any): void {
    this.logger.info('Processing online payment', { orderId: order._id });
    // TODO: Integrate with your payment gateway (Razorpay, Stripe, etc.)
    // For now, redirect to orders page
    alert('Online payment integration coming soon. Order has been placed.');
    this.router.navigate(['/orders']);
  }

  selectAddress(address: any): void {
    this.logger.info('Address selected', {
      city: address.city,
      state: address.state,
    });
    this.selectedAddress = address;
  }
}
