import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';

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
  private logger = inject(LoggerService);
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
    pincode: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{6}$')]),
  });

  onRegister() {
    this.formSubmitted = true;
    this.markFormGroupTouched(this.userForm);

    if (this.userForm.invalid) {
      this.logger.warn('Register form submitted with invalid data');
      alert('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const fullname = this.userForm.get('fullname')?.value;
    const email = this.userForm.get('email')?.value;
    const password = this.userForm.get('password')?.value;
    const street = this.userForm.get('street')?.value;
    const city = this.userForm.get('city')?.value;
    const state = this.userForm.get('state')?.value;
    const pincode = this.userForm.get('pincode')?.value;

    if (!fullname || !email || !password || !street || !city || !state || !pincode) {
      this.logger.warn('Register attempt with missing fields');
      this.errorMessage = 'Please fill all required fields';
      this.isLoading = false;
      return;
    }

    // ✅ NEVER log passwords
    this.logger.info('User registration started', { email });

    const userData = {
      fullname,
      email,
      password,
      street,
      city,
      state,
      pincode,
    };

    this.regSub = this.userService.registerUser(userData).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.message === 'User registered successfully') {
          this.logger.info('Registration successful', { email });

          alert('Registration successful!');
          this.loginAfterRegistration(email, password);
        } else {
          this.logger.warn('Unexpected registration response', res);
          this.errorMessage = res.message || 'Registration completed with unexpected response';
          alert(this.errorMessage);
        }
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 400) {
          this.logger.warn('Registration failed: Invalid input', error);
          this.errorMessage = error.error?.message || 'Invalid registration data';
        } else if (error.status === 409) {
          this.logger.warn('Registration failed: User already exists', { email });
          this.errorMessage = 'User with this email already exists';
        } else if (error.status === 500) {
          this.logger.error('Registration failed: Server error', error);
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.logger.error('Registration failed: Unknown error', error);
          this.errorMessage = 'Registration failed. Please try again.';
        }

        alert(this.errorMessage);
      },
    });
  }

  private loginAfterRegistration(email: string, password: string) {
    this.logger.info('Auto-login after successful registration started', { email });

    this.userService.loginUser({ email, password }).subscribe({
      next: (loginRes: any) => {
        if (loginRes.token && loginRes.user) {
          this.logger.info('Auto-login successful after registration', { email });

          this.authService.login(loginRes.user, loginRes.token);
          this.router.navigate(['/']);
        } else {
          this.logger.warn('Auto-login failed after registration');
          alert('Registration successful! Please login manually.');
          this.router.navigate(['/login']);
        }
      },

      error: (loginError) => {
        this.logger.error('Auto-login error after registration', loginError);
        alert('Registration successful! Please login manually.');
        this.router.navigate(['/login']);
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

  hasError(controlName: string, errorName: string): boolean {
    const control = this.userForm.get(controlName);
    return control ? control.hasError(errorName) && (control.touched || this.formSubmitted) : false;
  }

  ngOnDestroy(): void {
    this.regSub?.unsubscribe();
    this.logger.info('Register component destroyed, subscription cleaned');
  }
}
