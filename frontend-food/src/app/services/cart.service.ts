import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cart = new BehaviorSubject<any[]>([]);
  cart$ = this.cart.asObservable();

  getCart() {
    return this.cart.getValue();
  }

  addItem(item: any) {
    const current = this.getCart();

    // only allow cart for 1 restaurant
    if (current.length > 0 && current[0].restaurant !== item.restaurant) {
      this.cart.next([]);  // clear old cart
    }

    const exists = current.find(i => i.menuItem === item.menuItem);

    if (exists) {
      exists.quantity += 1;
    } else {
      current.push({ ...item, quantity: 1 });
    }

    this.cart.next([...current]);
  }

  removeItem(id: string) {
    const updated = this.getCart().filter(i => i.menuItem !== id);
    this.cart.next(updated);
  }

  clearCart() {
    this.cart.next([]);
  }

  updateCart(items: any[]) {
    this.cart.next(items);
  }

  getCheckoutData() {
    const cart = this.getCart();
    if (cart.length === 0) {
      return null;
    }

    return {
      restaurantId: cart[0].restaurant,
      items: cart.map(i => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        price: i.price
      })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
  }
}
