import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface NavLink {
  path: string;
  label: string;
  exact: boolean; // Required, not optional
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private authSub?: Subscription;
  
  isLoggedIn = false;
  currentUser: User | null = null;
  showUserDropdown = false;
  
  // Navigation links - exact is required
  navLinks: NavLink[] = [
    { path: '/', label: 'Home', exact: true },
    { path: '/orders', label: 'My Orders', exact: false }
  ];

  ngOnInit() {
    // Subscribe to authentication state changes
    this.authSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  // Get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser?.fullname) return 'U';
    return this.currentUser.fullname.charAt(0).toUpperCase();
  }

  // Toggle user dropdown menu
  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  // Close dropdown when clicking outside
  closeDropdown() {
    this.showUserDropdown = false;
  }

  // Handle logout
  logout() {
    this.authService.logout();
    this.showUserDropdown = false;
    this.router.navigate(['/']);
  }

  // Check if current route is active
  isActive(path: string, exact: boolean = false): boolean {
    if (exact) {
      return this.router.url === path;
    }
    return this.router.url.startsWith(path);
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }
}