
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string | number;
  startDate: string;
  endDate: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss'
})
export class ProjectEditComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private projectId = '';

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly statuses = [
    { label: 'Active', value: 1 },
    { label: 'Completed', value: 2 },
    { label: 'Archived', value: 3 }
  ];

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
    status: [1, Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.projectId) {
      this.loading.set(false);
      this.errorMessage.set('Project ID was not provided.');
      return;
    }

    this.loadProject();
  }

  loadProject(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<ApiResponse<Project>>(
      `${environment.apiUrl}/projects/${this.projectId}`
    ).subscribe({
      next: (response) => {
        const project = response.data;

        if (!response.success || !project) {
          this.errorMessage.set('Unable to load project information.');
          this.loading.set(false);
          return;
        }

        this.form.patchValue({
          name: project.name,
          description: project.description,
          status: this.getStatusValue(project.status),
          startDate: this.toDateInputValue(project.startDate),
          endDate: this.toDateInputValue(project.endDate)
        });

        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Failed to load project information.'
        );
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (new Date(formValue.endDate) < new Date(formValue.startDate)) {
      this.errorMessage.set('End date cannot be earlier than start date.');
      return;
    }

    this.saving.set(true);

    const request = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      status: Number(formValue.status),
      startDate: `${formValue.startDate}T00:00:00`,
      endDate: `${formValue.endDate}T00:00:00`
    };

    this.http.put<ApiResponse<Project>>(
      `${environment.apiUrl}/projects/${this.projectId}`,
      request
    ).subscribe({
      next: (response) => {
        this.saving.set(false);

        if (!response.success) {
          this.errorMessage.set(
            response.message || 'Unable to update project.'
          );
          return;
        }

        this.successMessage.set('Project updated successfully.');

        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 1000);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(
          error.error?.message || 'Failed to update project. Please try again.'
        );
      }
    });
  }

  getStatusValue(status: string | number): number {
    if (typeof status === 'number') {
      return status;
    }

    const normalized = status.toLowerCase();

    switch (normalized) {
      case 'active':
        return 1;
      case 'completed':
        return 2;
      case 'archived':
        return 3;
      default:
        return 1;
    }
  }

  private toDateInputValue(date: string): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  get name() {
    return this.form.controls.name;
  }

  get description() {
    return this.form.controls.description;
  }

  get startDate() {
    return this.form.controls.startDate;
  }

  get endDate() {
    return this.form.controls.endDate;
  }
}
