import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.restaurant.service';

@Component({
  selector: 'app-restaurant-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restaurant-register.html',
  styleUrls: ['./restaurant-register.css'],
})
export class RestaurantRegister {
  registrationForm: FormGroup;
  imagePreview = signal<string | null>(null);
  isDragOver = signal(false);
  selectedFile: File | null = null;
  isLoading = signal(false);
  formSubmitted = signal(false);

  constructor(
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.registrationForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cuisineType: ['', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['Gujarat', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      }),
    });
  }

  // Getter for address form group with type safety
  get addressFormGroup(): FormGroup {
    return this.registrationForm.get('address') as FormGroup;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.validateAndSetImage(file);
    }
  }

  private validateAndSetImage(file: File): void {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, JPG, GIF, WEBP)');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.selectedFile = null;
  }

  get isFormReady(): boolean {
    return this.registrationForm.valid && !!this.selectedFile && !this.isLoading();
  }

  onSubmit(): void {
    this.formSubmitted.set(true);

    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.registrationForm);

    if (!this.registrationForm.valid) {
      alert('Please fill all required fields correctly');
      return;
    }

    if (!this.selectedFile) {
      alert('Please upload a restaurant image');
      return;
    }

    this.isLoading.set(true);

    // Prepare the data object exactly as backend expects
    const formData = new FormData();

    // Append simple fields
    formData.append('name', this.registrationForm.get('name')?.value);
    formData.append('email', this.registrationForm.get('email')?.value);
    formData.append('password', this.registrationForm.get('password')?.value);
    formData.append('description', this.registrationForm.get('description')?.value);
    formData.append('cuisineType', this.registrationForm.get('cuisineType')?.value);

    // Append address as JSON string
    const address = this.addressFormGroup.value;
    formData.append('address', JSON.stringify(address));

    // Append image file - IMPORTANT: field name must be "photo"
    formData.append('photo', this.selectedFile);

    this.restaurantService.registerRestaurant(formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);

        this.authService.register(response.restaurant, response.token);
        alert('Restaurant registered successfully! Welcome to our platform!');

        // Redirect to login
        this.router.navigate(['/restaurant/home']);
      },
      error: (error) => {
        this.isLoading.set(false);

        let errorMessage = 'Registration failed. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 409) {
          errorMessage = 'Restaurant with this email already exists';
        } else if (error.status === 400) {
          errorMessage = 'Invalid data. Please check your input';
        }

        alert(errorMessage);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper method to check if field has error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.registrationForm.get(controlName);
    return control
      ? control.hasError(errorName) && (control.touched || this.formSubmitted())
      : false;
  }

  // Helper method to check if address field has error
  hasAddressError(controlName: string, errorName: string): boolean {
    const control = this.addressFormGroup.get(controlName);
    return control
      ? control.hasError(errorName) && (control.touched || this.formSubmitted())
      : false;
  }
}
