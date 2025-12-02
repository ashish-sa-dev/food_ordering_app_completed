import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Navbar } from "./components/navbar/navbar";
import { Search } from "./components/search/search";
import { RestaurantCard } from "./components/restaurant-card/restaurant-card";
import { RestaurantService } from "./services/restaurant.service";
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Search, RestaurantCard],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private authSub?: Subscription;
  private userSub?: Subscription;

  restaurants: any[] = [];
  isSearching = false;
  title = "Popular Restaurants";
  
  // User state
  currentUser = signal<any>(null);

  constructor(
    protected router: Router,
    private restaurantService: RestaurantService
  ) {}

  ngOnInit() {
    // Subscribe to auth state changes
    this.authSub = this.authService.isLoggedIn$.subscribe(isLogged => {
      console.log('Auth state changed:', isLogged);
      this.loadDefaultRestaurants(isLogged);
    });

    // Subscribe to user data changes
    this.userSub = this.authService.currentUser$.subscribe(user => {
      console.log('User data changed:', user);
      this.currentUser.set(user);
    });

    // Initial load
    this.loadDefaultRestaurants(this.authService.isLoggedIn);
  }

  // Load Nearby / Popular based on login
  loadDefaultRestaurants(isLoggedIn: boolean) {
    console.log("Loading restaurants for:", isLoggedIn ? 'Logged in' : 'Not logged in');
    
    if (isLoggedIn) {
      this.restaurantService.getNearby().subscribe({
        next: (res: any) => {
          console.log("Nearby restaurants:", res);
          this.restaurants = res.data || [];
          this.isSearching = false;
          this.title = "Nearby Restaurants";
        },
        error: (err) => {
          console.error('Error loading nearby restaurants:', err);
          // Fallback to popular if nearby fails
          this.loadPopularRestaurants();
        }
      });
    } else {
      this.loadPopularRestaurants();
    }
  }

  private loadPopularRestaurants() {
    this.restaurantService.getPopular().subscribe({
      next: (res: any) => {
        this.restaurants = res.data || [];
        this.isSearching = false;
        this.title = "Popular Restaurants";
      },
      error: (err) => {
        console.error('Error loading popular restaurants:', err);
        this.restaurants = [];
      }
    });
  }

  // Receive search results
  receiveRestaurant(res: any) {
    // If empty search → load default again
    if (!res) {
      this.isSearching = false;
      console.log("No results, loading default");
      this.loadDefaultRestaurants(this.authService.isLoggedIn);
      return;
    }

    this.restaurants = res.restaurants || [];
    this.isSearching = true;
    this.title = "Search Results";
  }

  // Check if on specific pages (for navbar hiding)
  isLoginPage() {
    return this.router.url === '/login';
  }

  isForgotPasswordPage() {
    return this.router.url === '/forgot-password';
  }

  isRegisterPage() {
    return this.router.url === '/register';
  }

  isRestaurant() {
    return this.router.url === '/restaurant/register';
  }

  isRestaurantDetails() {
    return /^\/restaurant\/[^/]+$/.test(this.router.url);
  }

  isCart() {
    return this.router.url === '/cart';
  }

  isCheckout() {
    return this.router.url === '/checkout';
  }

  isRestaurantLogin() {
    return this.router.url === '/restaurant/dashboard/login';
  }
  isOrders(){
    return this.router.url === '/orders';
  }

  // Logout user
  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }
}