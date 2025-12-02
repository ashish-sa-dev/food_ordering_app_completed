import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register implements OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private regSub?: Subscription;
  
  isLoading = false;
  errorMessage = '';
  formSubmitted = false;

  userForm = new FormGroup({
    fullname: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    street: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    state: new FormControl('', [Validators.required]),
    pincode: new FormControl('', [
      Validators.required, 
      Validators.pattern('^[0-9]{6}$') // 6 digit pincode validation
    ])
  });

  onRegister() {
    this.formSubmitted = true;
    
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.userForm);
    
    if (this.userForm.invalid) {
      alert('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Get form values with proper type checking
    const fullname = this.userForm.get('fullname')?.value;
    const email = this.userForm.get('email')?.value;
    const password = this.userForm.get('password')?.value;
    const street = this.userForm.get('street')?.value;
    const city = this.userForm.get('city')?.value;
    const state = this.userForm.get('state')?.value;
    const pincode = this.userForm.get('pincode')?.value;

    // Validate all required fields exist
    if (!fullname || !email || !password || !street || !city || !state || !pincode) {
      this.errorMessage = 'Please fill all required fields';
      this.isLoading = false;
      return;
    }

    // Create user data object matching backend expectations
    const userData = {
      fullname,
      email,
      password,
      street,
      city,
      state,
      pincode
    };

    console.log('Registering user:', userData);

    // Use UserService instead of direct HTTP call
    this.regSub = this.userService.registerUser(userData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // Check if registration was successful
        if (res.message === 'User registered successfully') {
          alert('Registration successful!');
          
          // After successful registration, we need to login the user
          // Since backend doesn't return user data on register, we need to login
          this.loginAfterRegistration(email, password);
        } else {
          this.errorMessage = res.message || 'Registration completed but with unexpected response';
          alert(this.errorMessage);
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid registration data';
        } else if (error.status === 409) {
          this.errorMessage = 'User with this email already exists';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        
        alert(this.errorMessage);
        console.error('Registration error:', error);
      }
    });
  }

  // Helper method to login user after successful registration
  private loginAfterRegistration(email: string, password: string) {
    this.userService.loginUser({ email, password }).subscribe({
      next: (loginRes: any) => {
        // Assuming backend returns { token: '...', user: {...} }
        if (loginRes.token && loginRes.user) {
          // Set authentication state
          this.authService.login(loginRes.user, loginRes.token);
          console.log('User registered and logged in successfully');
          
          // Redirect to home page
          this.router.navigate(['/']);
        } else {
          // Registration successful but login failed
          alert('Registration successful! Please login with your credentials.');
          this.router.navigate(['/login']);
        }
      },
      error: (loginError) => {
        console.error('Auto-login after registration failed:', loginError);
        alert('Registration successful! Please login with your credentials.');
        this.router.navigate(['/login']);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods for template validation
  hasError(controlName: string, errorName: string): boolean {
    const control = this.userForm.get(controlName);
    return control ? control.hasError(errorName) && (control.touched || this.formSubmitted) : false;
  }

  ngOnDestroy(): void {
    this.regSub?.unsubscribe();
  }
}