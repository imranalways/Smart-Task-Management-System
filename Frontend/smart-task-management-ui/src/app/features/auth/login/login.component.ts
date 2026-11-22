
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({

        next: () => {
          const destination = this.getReturnUrl();

          console.log('Login successful. Redirecting to:', destination);

          this.router.navigateByUrl(destination, {
            replaceUrl: true
          }).then(navigated => {

            if (!navigated) {
              console.warn('Requested navigation failed. Redirecting to dashboard.');

              this.router.navigateByUrl('/dashboard', {
                replaceUrl: true
              });
            }

          }).catch(error => {
            console.error('Navigation error:', error);
          });
        },

        error: (err: HttpErrorResponse) => {
          console.error('Login error:', err);
          this.errorMessage.set(this.extractMessage(err));
        }

      });
  }

  private getReturnUrl(): string {

    const url = this.route.snapshot.queryParamMap.get('returnUrl');

    if (
      !url ||
      !url.startsWith('/') ||
      url.startsWith('//') ||
      url.startsWith('/auth')
    ) {
      return '/dashboard';
    }

    return url;
  }

  private extractMessage(err: HttpErrorResponse): string {

    if (err.status === 0) {
      return 'Cannot reach the server. Please try again later.';
    }

    if (err.status === 401) {
      return 'Invalid email or password.';
    }

    if (err.status === 429) {
      return 'Too many attempts. Please wait a moment.';
    }

    const errors = err.error?.errors;

    if (Array.isArray(errors) && errors.length) {
      return errors.join(' ');
    }

    return err.error?.message
      ?? err.error?.Message
      ?? 'Login failed.';
  }
}
