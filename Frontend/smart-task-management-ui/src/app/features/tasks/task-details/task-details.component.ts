
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task/task.model';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss'
})
export class TaskDetailsComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly task = signal<Task | null>(null);
  readonly loading = signal(true);
  readonly savingStatus = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  selectedStatus = 1;

  readonly statuses = [
    { label: 'To Do', value: 1 },
    { label: 'In Progress', value: 2 },
    { label: 'Completed', value: 3 },
    { label: 'Cancelled', value: 4 }
  ];

  private taskId = '';

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.taskId) {
      this.errorMessage.set('Task ID is missing.');
      this.loading.set(false);
      return;
    }

    this.loadTask();
  }
get canUpdateTasks(): boolean {
    const role = this.authService.getRole();

    return role === 'Admin' || role === 'ProjectManager';
  }


  loadTask(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.taskService.getTaskById(this.taskId).subscribe({
      next: task => {
        this.task.set(task);
        this.selectedStatus = this.getStatusValue(task.status);
        this.loading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message || 'Unable to load task details.'
        );
        this.loading.set(false);
      }
    });
  }

  updateStatus(): void {
    const currentTask = this.task();

    if (!currentTask || this.savingStatus()) {
      return;
    }

    if (this.selectedStatus === this.getStatusValue(currentTask.status)) {
      return;
    }

    this.savingStatus.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.taskService.updateStatus(
      currentTask.id,
      { status: this.selectedStatus }
    ).subscribe({
      next: () => {
        this.savingStatus.set(false);
        this.successMessage.set('Task status updated successfully.');
        this.loadTask();
      },
      error: error => {
        this.savingStatus.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Unable to update task status.'
        );
      }
    });
  }

  getStatusValue(status: string): number {
    const values: Record<string, number> = {
      Todo: 1,
      InProgress: 2,
      Completed: 3,
      Cancelled: 4
    };

    return values[status] ?? 1;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      Todo: 'status-todo',
      InProgress: 'status-progress',
      Completed: 'status-completed',
      Cancelled: 'status-cancelled'
    };

    return classes[status] ?? 'status-default';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      Low: 'priority-low',
      Medium: 'priority-medium',
      High: 'priority-high',
      Critical: 'priority-critical'
    };

    return classes[priority] ?? 'priority-default';
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      Todo: 'To Do',
      InProgress: 'In Progress',
      Completed: 'Completed',
      Cancelled: 'Cancelled'
    };

    return labels[status] ?? status;
  }
}
