import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../core/services/logger.service';
@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  cart: any[] = [];
  restaurantId!: string;
  total = 0;

  ngOnInit(): void {
    this.logger.info('Cart page loaded', { items: this.cart.length });
    this.cartService.cart$.subscribe((items) => {
      this.cart = items;
      this.calculateTotal();

      if (items.length > 0) {
        this.restaurantId = items[0].restaurant;
      }
    });
  }

  calculateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  increase(item: any) {
    this.logger.info('Item quantity increased', {
      itemId: item.menuItem,
      newQuantity: (item.quantity || 0) + 1,
    });
    this.cartService.addItem(item);
  }

  decrease(item: any) {
    this.logger.info('Item quantity decreased', {
      itemId: item.menuItem,
      newQuantity: (item.quantity || 1) - 1,
    });
    if (item.quantity === 1) {
      this.cartService.removeItem(item.menuItem);
    } else {
      item.quantity -= 1;
      this.cartService.updateCart([...this.cart]);
    }
    this.calculateTotal();
  }

  remove(id: string) {
    this.logger.info('Item removed from cart', { itemId: id });
    this.cartService.removeItem(id);
    this.calculateTotal();
  }

  goBack() {
    this.logger.info('Navigating back to restaurant', { restaurantId: this.restaurantId });
    this.router.navigate(['/restaurant', this.restaurantId]);
  }

  checkout() {
    this.logger.info('Proceeding to checkout', {
      cartTotal: this.total,
      itemCount: this.cart.length,
    });
    this.router.navigate(['/checkout']);
  }
}
