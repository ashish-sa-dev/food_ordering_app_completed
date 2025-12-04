import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../core/services/logger.service';

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
  logger = inject(LoggerService);

  isLoading = false;
  errorMessage = '';

  userForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  onSubmit() {
    if (this.userForm.invalid) {
      this.logger.warn('Login form submitted with invalid data');
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.userForm.get('email')?.value;
    const password = this.userForm.get('password')?.value;

    if (!email || !password) {
      this.logger.warn('Login attempt with missing email or password');
      this.errorMessage = 'Please fill all required fields';
      this.isLoading = false;
      return;
    }

    // ✅ DO NOT LOG PASSWORDS
    this.logger.info('Login attempt started', { email });

    const credentials = { email, password };

    this.userService.loginUser(credentials).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.token && res.user) {
          this.logger.info('Login successful', {
            userId: res.user._id,
            email: res.user.email,
          });

          this.authService.login(res.user, res.token);
          this.router.navigate(['/']);
        } else {
          this.logger.warn('Login failed due to invalid server response', res);
          this.errorMessage = 'Invalid response from server';
        }
      },

      error: (err) => {
        this.isLoading = false;
        this.authService.logout(); // Ensure clean state

        if (err.status === 401) {
          this.logger.warn('Login failed: Invalid credentials', { email });
          this.errorMessage = 'Invalid email or password';
        } else if (err.status === 400) {
          this.logger.warn('Login failed: Bad request', err);
          this.errorMessage = err.error?.message || 'Bad request';
        } else {
          this.logger.error('Login failed: Server error', err);
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
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
