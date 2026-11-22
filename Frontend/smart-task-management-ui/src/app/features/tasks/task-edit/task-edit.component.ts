
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { TASK_PRIORITIES } from '../../../core/models/task/task.model';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private taskId = '';

  readonly priorities = TASK_PRIORITIES;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
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
    this.taskId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.taskId) {
      this.errorMessage.set('Task ID is missing.');
      this.loading.set(false);
      return;
    }

    this.loadTask();
  }

  loadTask(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.taskService.getTaskById(this.taskId).subscribe({
      next: task => {
        this.form.patchValue({
          title: task.title,
          description: task.description,
          priority: this.getPriorityValue(task.priority),
          dueDate: this.toDateInputValue(task.dueDate)
        });

        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Unable to load task details.'
        );
      }
    });
  }

  private getPriorityValue(priority: string): number {
    const values: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4
    };

    return values[priority] ?? 2;
  }

  private toDateInputValue(date: string): string {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();

    this.saving.set(true);
    this.errorMessage.set('');

    this.taskService.updateTask({
      id: this.taskId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: Number(values.priority),
      dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/tasks/details', this.taskId]);
      },
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Unable to update task.'
        );
      }
    });
  }
}
