import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private logger = inject(LoggerService);

  private cart = new BehaviorSubject<any[]>([]);
  cart$ = this.cart.asObservable();

  constructor() {
    this.logger.info('CartService initialized');
  }

  // ✅ GET CURRENT CART
  getCart() {
    const cart = this.cart.getValue();
    this.logger.info('Fetching cart state', { items: cart.length });
    return cart;
  }

  // ✅ ADD ITEM TO CART
  addItem(item: any) {
    this.logger.info('Adding item to cart', {
      menuItem: item.menuItem,
      restaurant: item.restaurant,
    });

    const current = this.getCart();

    // ✅ ONLY ALLOW CART FOR ONE RESTAURANT
    if (current.length > 0 && current[0].restaurant !== item.restaurant) {
      this.logger.warn('Different restaurant detected — clearing cart');
      this.cart.next([]);
    }

    const exists = current.find((i) => i.menuItem === item.menuItem);

    if (exists) {
      exists.quantity += 1;

      this.logger.info('Item quantity increased', {
        menuItem: item.menuItem,
        quantity: exists.quantity,
      });
    } else {
      current.push({ ...item, quantity: 1 });

      this.logger.info('New item added to cart', {
        menuItem: item.menuItem,
        quantity: 1,
      });
    }

    this.cart.next([...current]);
    this.logger.info('Cart updated', { totalItems: current.length });
  }

  // ✅ REMOVE ITEM FROM CART
  removeItem(id: string) {
    this.logger.info('Removing item from cart', { menuItem: id });

    const updated = this.getCart().filter((i) => i.menuItem !== id);

    this.cart.next(updated);

    this.logger.info('Item removed, updated cart count', {
      totalItems: updated.length,
    });
  }

  // ✅ CLEAR CART
  clearCart() {
    this.logger.warn('Clearing entire cart');
    this.cart.next([]);
  }

  // ✅ REPLACE FULL CART (SYNC CASE)
  updateCart(items: any[]) {
    this.logger.info('Updating entire cart from external source', {
      itemCount: items.length,
    });

    this.cart.next(items);
  }

  // ✅ PREPARE CHECKOUT DATA
  getCheckoutData() {
    const cart = this.getCart();

    if (cart.length === 0) {
      this.logger.warn('Checkout requested with empty cart');
      return null;
    }

    const checkoutPayload = {
      restaurantId: cart[0].restaurant,
      items: cart.map((i) => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        price: i.price,
      })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    this.logger.info('Checkout payload prepared', {
      restaurantId: checkoutPayload.restaurantId,
      total: checkoutPayload.total,
      itemCount: checkoutPayload.items.length,
    });

    return checkoutPayload;
  }
}
