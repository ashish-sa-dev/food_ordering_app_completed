import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import { CartService } from '../../services/cart.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-restaurant',
  imports: [],
  templateUrl: './restaurant.html',
  styleUrl: './restaurant.css',
})
export class Restaurant implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restaurantService = inject(RestaurantService);
  private cartService = inject(CartService);
  private logger = inject(LoggerService);

  restaurantId!: string;
  restaurant: any = null;
  loading = true;

  cartCount = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantId = id;
      this.logger.info('Restaurant page loaded', { restaurantId: id });

      this.restaurantService.getRestaurantById(id).subscribe({
        next: (res: any) => {
          this.restaurant = res.restaurant;
          this.loading = false;
          this.logger.info('Restaurant data loaded successfully', {
            restaurantName: res.restaurant.name,
            menuItemCount: res.restaurant.menuItems?.length || 0,
          });
        },
        error: (err) => {
          this.logger.error('Failed to load restaurant data', { restaurantId: id });
          this.loading = false;
        },
      });
    }

    // subscribe to live cart updates
    this.cartService.cart$.subscribe((cart) => {
      this.cartCount = cart.reduce((sum: number, i: any) => sum + i.quantity, 0);
    });
  }

  // ---------------- CART FUNCTIONS ----------------

  addToCart(item: any) {
    this.logger.info('Item added to cart', {
      itemName: item.name,
      itemPrice: item.price,
      restaurantId: this.restaurantId,
    });
    this.cartService.addItem({
      restaurant: this.restaurantId,
      menuItem: item._id,
      name: item.name,
      price: item.price,
    });
  }

  openCart() {
    this.logger.info('Opening cart page', { cartItemCount: this.cartCount });
    this.router.navigate(['/cart']);
  }
}
