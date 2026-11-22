
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly registrationSuccess = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      firstName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],

      confirmPassword: [
        '',
        Validators.required
      ]
    },
    {
      validators: passwordMatchValidator
    }
  );

  get firstName() {
    return this.form.controls.firstName;
  }

  get lastName() {
    return this.form.controls.lastName;
  }

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  get passwordMismatch(): boolean {
    return !!this.form.errors?.['passwordMismatch']
      && this.confirmPassword.touched;
  }

  submit(): void {

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const request = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      password: formValue.password,
      confirmPassword: formValue.confirmPassword
    };

    this.loading.set(true);

    this.authService.register(request)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({

        next: () => {
          this.registrationSuccess.set(true);

          this.successMessage.set(
            'Your account has been created successfully.'
          );

          this.form.reset();
        },

        error: (error: HttpErrorResponse | Error) => {
          this.errorMessage.set(
            this.extractMessage(error)
          );
        }

      });
  }

  private extractMessage(
    error: HttpErrorResponse | Error
  ): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return 'Cannot reach the server. Please try again later.';
      }

      if (error.status === 409) {
        return 'An account with this email already exists.';
      }

      if (error.status === 429) {
        return 'Too many registration attempts. Please wait.';
      }

      const errors = error.error?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        return errors.join(' ');
      }

      return error.error?.message
        ?? error.error?.Message
        ?? 'Registration failed. Please try again.';
    }

    return error.message || 'Registration failed.';
  }
}
