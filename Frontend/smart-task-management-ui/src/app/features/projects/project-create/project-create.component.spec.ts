
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent {

  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100)
    ]],
    description: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(1000)
    ]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  submit(): void {

    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.endDate < value.startDate) {
      this.errorMessage.set(
        'End date cannot be earlier than start date.'
      );
      return;
    }

    this.loading.set(true);

    this.projectService.createProject(value).subscribe({

      next: () => {
        this.loading.set(false);
        this.router.navigate(['/projects']);
      },

      error: error => {
        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ??
          'Unable to create project. Please try again.'
        );
      }

    });
  }
}
