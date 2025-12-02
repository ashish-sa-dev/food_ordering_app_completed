import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthService } from '../../services/auth.restaurant.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
  
interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable?: boolean;
  category?: string;
  isVeg?: boolean;
  restaurant?: string;
}

// Update Order interfaces to match API response
interface OrderItem {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
}

interface RestaurantOrder {
  _id: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'out for delivery' | 'delivered';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'cod' | 'online';
  paymentStatus?: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface RestaurantProfile {
  _id: string;
  name: string;
  email: string;
  description: string;
  cuisineType: string[];
  image: string;
  isOpen: boolean;
  active: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    location: {
      type: string;
      coordinates: number[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-restaurant-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurant-home.html',
  styleUrls: ['./restaurant-home.css']
})
export class RestaurantHome implements OnInit, OnDestroy {
  activeTab = signal<'menu' | 'orders'>('menu');
  showAddMenuForm = signal(false);
  selectedOrderStatus = signal<'pending' | 'preparing' | 'out for delivery' | 'delivered'>('pending');
  showUserMenu = signal(false);
  
  menuForm: FormGroup;
  menuItems = signal<MenuItem[]>([]);
  orders = signal<RestaurantOrder[]>([]);
  orderCounts = signal<Record<string, number>>({});
  
  // Restaurant profile
  restaurantProfile = signal<RestaurantProfile | null>(null);
  isLoadingProfile = signal(true);
  
  // Image upload signals
  menuImagePreview = signal<string | null>(null);
  menuDragOver = signal(false);
  selectedMenuFile: File | null = null;
  isLoading = signal(false);
  isLoadingOrders = signal(false);

  // Update order statuses to match your API
  orderStatuses: ('pending' | 'preparing' | 'out for delivery' | 'delivered')[] = 
    ['pending', 'preparing', 'out for delivery', 'delivered'];
  private authSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private router: Router
  ) {
    this.menuForm = this.createMenuForm();
  }

  ngOnInit(): void {
    // Check if restaurant is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/restaurant/login']);
      return;
    }
    
    // Load restaurant profile
    this.loadRestaurantProfile();
    
    // Load menu items
    this.loadMenuItems();
    
    // Load order counts
    this.loadOrderCounts();
    
    // Load orders for default status when orders tab is active
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.router.navigate(['/restaurant/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Load restaurant profile from backend
  private loadRestaurantProfile(): void {
    this.isLoadingProfile.set(true);
    
    const storedData = this.authService.getRestaurantData();
    
    if (storedData) {
      this.restaurantProfile.set(storedData);
      this.isLoadingProfile.set(false);
    } else {
      this.isLoadingProfile.set(false);
    }
  }

  // Load orders by status from API
  private loadOrdersByStatus(status: string): void {
    this.isLoadingOrders.set(true);
    this.orders.set([]);
    
    this.restaurantService.getOrdersByStatus(status).subscribe({
      next: (response: any) => {
        if (response.success && response.orders) {
          this.orders.set(response.orders);
        }
        this.isLoadingOrders.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoadingOrders.set(false);
        alert('Failed to load orders. Please try again.');
      }
    });
  }

  // Load order counts from API
  private loadOrderCounts(): void {
    this.restaurantService.getOrderCounts().subscribe({
      next: (response: any) => {
        if (response.success && response.counts) {
          this.orderCounts.set(response.counts);
        }
      },
      error: (error) => {
        console.error('Error loading order counts:', error);
      }
    });
  }

  // Update order status via API
  updateOrderStatus(orderId: string, newStatus: 'preparing' | 'out for delivery' | 'delivered'): void {
    if (!confirm(`Are you sure you want to change this order to "${newStatus}"?`)) {
      return;
    }

    this.restaurantService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update the order in the list
          this.orders.update(orders =>
            orders.map(order =>
              order._id === orderId ? { ...order, status: newStatus } : order
            )
          );
          
          // Reload order counts
          this.loadOrderCounts();
          
          // If current status changed, remove from list
          if (this.selectedOrderStatus() !== newStatus) {
            this.orders.update(orders => 
              orders.filter(order => order._id !== orderId)
            );
          }
          
          alert(`Order status updated to ${newStatus}`);
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        alert(error.error?.message || 'Failed to update order status');
      }
    });
  }

  // Get the next status for an order
  getNextStatus(currentStatus: string): 'preparing' | 'out for delivery' | 'delivered' | null {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'out for delivery';
      case 'out for delivery':
        return 'delivered';
      default:
        return null;
    }
  }

  // Get button text based on current status
  getActionButtonText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Start Preparing';
      case 'preparing':
        return 'Mark Ready for Delivery';
      case 'out for delivery':
        return 'Mark as Delivered';
      default:
        return 'Completed';
    }
  }

  // When order status tab is clicked
  onOrderStatusClick(status: string): void {
    this.selectedOrderStatus.set(status as any);
    this.loadOrdersByStatus(status);
  }

  // Get filtered orders (already handled by API)
  getFilteredOrders(): RestaurantOrder[] {
    return this.orders();
  }

  // Get pending orders count for the badge
  getPendingOrdersCount(): number {
    const counts = this.orderCounts();
    return (counts['pending'] || 0) + (counts['preparing'] || 0) + (counts['out for delivery'] || 0);
  }

  // Get orders count by status
  getOrdersCountByStatus(status: string): number {
    return this.orderCounts()[status] || 0;
  }

  // Get restaurant name for display
  getRestaurantName(): string {
    const profile = this.restaurantProfile();
    return profile?.name || 'Restaurant';
  }

  getRestaurantInitials(): string {
    const name = this.getRestaurantName();
    return name.charAt(0).toUpperCase();
  }

  getRestaurantEmail(): string {
    const profile = this.restaurantProfile();
    return profile?.email || '';
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(prev => !prev);
  }

  logout(): void {
    this.restaurantService.logoutRestaurant().subscribe({
      next:()=>{
        localStorage.removeItem('restaurant_token');
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('restaurant_data');
        console.log("success remove cookie")
        this.router.navigate(['/restaurant/login']);
    },
    error: (error) => {
        console.error('Logout error:', error);
        localStorage.removeItem('restaurant_token');
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('restaurant_data');
        this.router.navigate(['/restaurant/login']);
      }
    });
    
    this.showUserMenu.set(false);
  }

  private createMenuForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(1)]],
      image: ['', Validators.required]
    });
  }

  private loadMenuItems(): void {
    this.restaurantService.getMenuItems().subscribe({
      next: (response: any) => {
        this.menuItems.set(response.menuItems || response.data || []);
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
      }
    });
  }

  // Helper to get full image URL
  getImageUrl(imageName: string | undefined): string {
    if (!imageName || imageName.includes('http')) {
      return imageName || 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=60';
    }
    return `http://localhost:5000/img/menuItems/${imageName}`;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // When orders tab becomes active, load orders
  onTabChange(tab: 'menu' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab === 'orders') {
      this.loadOrdersByStatus(this.selectedOrderStatus());
      this.loadOrderCounts();
    }
  }

  // UI Helper methods
  getNavClass(tab: string): string {
    const baseClass = "flex items-center px-4 py-2 rounded-2xl font-semibold transition-all duration-200";
    return this.activeTab() === tab 
      ? `${baseClass} bg-orange-500 text-white`
      : `${baseClass} text-gray-600 hover:text-orange-500 hover:bg-orange-50`;
  }

  // Rest of your existing methods for menu management...
  // Image upload methods
  onMenuFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetMenuImage(file);
    }
  }

  onMenuDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragOver.set(true);
  }

  onMenuDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragOver.set(false);
  }

  onMenuDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.validateAndSetMenuImage(file);
    }
  }

  private validateAndSetMenuImage(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, JPG, GIF, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    this.selectedMenuFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.menuImagePreview.set(reader.result as string);
      this.menuForm.patchValue({
        image: 'selected'
      });
      this.menuForm.get('image')?.markAsTouched();
    };
    reader.readAsDataURL(file);
  }

  removeMenuImage(): void {
    this.menuImagePreview.set(null);
    this.selectedMenuFile = null;
    this.menuForm.patchValue({
      image: ''
    });
    this.menuForm.get('image')?.markAsTouched();
  }

  cancelAddMenuForm(): void {
    this.showAddMenuForm.set(false);
    this.menuForm.reset();
    this.menuImagePreview.set(null);
    this.selectedMenuFile = null;
  }

  get isMenuFormReady(): boolean {
    const formValid = this.menuForm.valid;
    const hasFile = !!this.selectedMenuFile;
    const notLoading = !this.isLoading();
    
    return formValid && hasFile && notLoading;
  }

  addMenuItem(): void {
    if (!this.isMenuFormReady) {
      this.markFormGroupTouched(this.menuForm);
      
      if (!this.selectedMenuFile) {
        alert('Please upload an image for the menu item');
      }
      return;
    }

    this.isLoading.set(true);

    const formData = new FormData();
    
    formData.append('name', this.menuForm.get('name')?.value);
    formData.append('description', this.menuForm.get('description')?.value);
    formData.append('price', this.menuForm.get('price')?.value);
    formData.append('image', this.selectedMenuFile!);

    this.restaurantService.addMenuItem(formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        
        if (response.menuItem) {
          this.menuItems.update(items => [...items, response.menuItem]);
        }
        
        this.cancelAddMenuForm();
        this.showAddMenuForm.set(false);
        
        alert('Menu item added successfully!');
      },
      error: (error) => {
        this.isLoading.set(false);
        
        let errorMessage = 'Failed to add menu item. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid data. Please check your input';
        }
        
        alert(errorMessage);
      }
    });
  }

  toggleAvailability(itemId: string | undefined): void {
    if (!itemId) return;
    
    const item = this.menuItems().find(i => i._id === itemId);
    if (!item) return;
    
    const newAvailability = !item.isAvailable;
    
    this.restaurantService.updateMenuItemAvailability(itemId, newAvailability).subscribe({
      next: (response: any) => {
        this.menuItems.update(items =>
          items.map(i =>
            i._id === itemId ? { ...i, isAvailable: newAvailability } : i
          )
        );
        console.log('Availability updated:', response);
      },
      error: (error) => {
        console.error('Error updating availability:', error);
        alert('Failed to update availability. Please try again.');
      }
    });
  }

  deleteMenuItem(itemId: string | undefined): void {
    if (!itemId) return;
    
    if (confirm('Are you sure you want to delete this menu item?')) {
      this.restaurantService.deleteMenuItem(itemId).subscribe({
        next: (response: any) => {
          this.menuItems.update(items => items.filter(i => i._id !== itemId));
          console.log('Menu item deleted:', response);
          alert('Menu item deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting menu item:', error);
          alert('Failed to delete menu item. Please try again.');
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}