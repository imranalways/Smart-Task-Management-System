
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { TaskService } from '../../../core/services/task.service';

import {
  ApiResponse,
  CreateTaskRequest,
  ImproveDescriptionResponse,
  ProjectOption,
  TASK_PRIORITIES
} from '../../../core/models/task/task.model';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;

  readonly priorities = TASK_PRIORITIES;
  readonly projects = signal<ProjectOption[]>([]);
  readonly loadingProjects = signal(false);
  readonly saving = signal(false);
  readonly improvingDescription = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    title: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(150)
    ]],
    description: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(3000)
    ]],
    priority: [2, Validators.required],
    dueDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loadingProjects.set(true);

    this.http.get<ApiResponse<{
      items: ProjectOption[];
    }>>(`${this.apiUrl}/projects?pageNumber=1&pageSize=100`)
      .subscribe({
        next: response => {
          this.projects.set(response.data?.items ?? []);
          this.loadingProjects.set(false);
        },
        error: error => {
          this.loadingProjects.set(false);
          this.errorMessage.set(
            error?.error?.message || 'Unable to load projects.'
          );
        }
      });
  }

  improveDescription(): void {
    const description = this.form.controls.description.value.trim();

    if (description.length < 10) {
      this.form.controls.description.markAsTouched();
      this.errorMessage.set(
        'Enter at least 10 characters before improving the description.'
      );
      return;
    }

    this.improvingDescription.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post<ImproveDescriptionResponse>(
      `${this.apiUrl}/ai/improve-description`,
      { description }
    ).subscribe({
      next: response => {
        this.form.controls.description.setValue(
          response.improvedDescription
        );
        this.improvingDescription.set(false);
        this.successMessage.set('Description improved successfully.');
      },
      error: error => {
        this.improvingDescription.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Unable to improve the description.'
        );
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();

    const request: CreateTaskRequest = {
      projectId: values.projectId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: Number(values.priority),
      dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString()
    };

    this.saving.set(true);
    this.errorMessage.set('');

    this.taskService.createTask(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/tasks']);
      },
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Unable to create task.'
        );
      }
    });
  }
}
