import { Component, inject } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { UserService } from "../../services/user.service";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  userService = inject(UserService);
  authService = inject(AuthService);
  router = inject(Router);
  isLoading = false;
  errorMessage = '';

  userForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  onSubmit() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Get values with proper type assertion
    const email = this.userForm.get('email')?.value;
    const password = this.userForm.get('password')?.value;
    
    // Validate that values exist
    if (!email || !password) {
      this.errorMessage = 'Please fill all required fields';
      this.isLoading = false;
      return;
    }
    
    // Create the credentials object with proper types
    const credentials = {
      email: email,
      password: password
    };
    
    this.userService.loginUser(credentials).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // Assuming backend returns { token: '...', user: {...} }
        if (res.token && res.user) {
          this.authService.login(res.user, res.token);
          console.log('User logged in successfully');
          
          // Redirect to home page
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Invalid response from server';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.authService.logout(); // Ensure clean state
        
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (err.status === 400) {
          this.errorMessage = err.error?.message || 'Bad request';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
        
        console.error('Login error:', err);
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

  get email() {
    return this.userForm.get('email');
  }

  get password() {
    return this.userForm.get('password');
  }
}