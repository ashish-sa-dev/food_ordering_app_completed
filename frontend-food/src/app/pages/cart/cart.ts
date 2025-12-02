import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
    private cartService = inject(CartService);
  private router = inject(Router);

  cart: any[] = [];
  restaurantId!: string;
  total = 0;

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
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
    this.cartService.addItem(item);
  }

  decrease(item: any) {
    if (item.quantity === 1) {
      this.cartService.removeItem(item.menuItem);
    } else {
      item.quantity -= 1;
      this.cartService.updateCart([...this.cart]);
    }
    this.calculateTotal();
  }

  remove(id: string) {
    this.cartService.removeItem(id);
    this.calculateTotal();
  }

  goBack() {
    this.router.navigate(['/restaurant', this.restaurantId]);
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}
