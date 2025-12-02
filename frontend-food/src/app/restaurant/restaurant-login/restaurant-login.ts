import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthService } from '../../services/auth.restaurant.service';

@Component({
  selector: 'app-restaurant-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurant-login.html',
  styleUrls: ['./restaurant-login.css']
})
export class RestaurantLogin {
  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  formSubmitted = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private restaurantService: RestaurantService,
    private authService: AuthService
  ) {
    this.loginForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(prev => !prev);
  }

  onSubmit(): void {
    this.formSubmitted.set(true);
    
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.loginForm);
    
    if (!this.loginForm.valid) {
      alert('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    
    const loginData = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    console.log('Login Data:', loginData);
    
    this.restaurantService.loginRestaurant(loginData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        console.log('Login successful:', response);
        
        // Store authentication data using AuthService
        this.authService.login(response.restaurant, response.token);
        
        alert('Login successful! Welcome back!');
        
        // Navigate to restaurant home/dashboard
        this.router.navigate(['/restaurant/home']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.status === 404) {
          errorMessage = 'Restaurant not found';
        }
        
        alert(errorMessage);
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/restaurant/register']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Helper method to check if field has error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorName) && (control.touched || this.formSubmitted()) : false;
  }
}