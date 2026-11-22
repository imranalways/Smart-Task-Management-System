
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);

  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  appliedSearch = '';
  sortBy = 'dueDate';
  descending = false;

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.taskService.getTasks({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.appliedSearch || undefined,
      sortBy: this.sortBy,
      descending: this.descending
    }).subscribe({
      next: response => {
        this.tasks.set(response.items ?? []);
        this.totalRecords.set(response.totalRecords ?? 0);
        this.totalPages.set(response.totalPages ?? 0);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load tasks. Please try again.'
        );
      }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.appliedSearch = this.searchTerm.trim();
    this.loadTasks();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.appliedSearch = '';
    this.pageNumber = 1;
    this.loadTasks();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pageNumber = page;
    this.loadTasks();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.pageNumber = 1;
    this.loadTasks();
  }

  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.descending = !this.descending;
    } else {
      this.sortBy = field;
      this.descending = false;
    }

    this.pageNumber = 1;
    this.loadTasks();
  }

  deleteTask(task: Task): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        if (this.tasks().length === 1 && this.pageNumber > 1) {
          this.pageNumber--;
        }

        this.loadTasks();
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message || 'Failed to delete task.'
        );
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'todo':
        return 'status-todo';
      case 'inprogress':
        return 'status-progress';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      case 'critical':
        return 'priority-critical';
      default:
        return 'priority-default';
    }
  }

  formatStatus(status: string): string {
    if (status === 'Todo') {
      return 'To Do';
    }

    if (status === 'InProgress') {
      return 'In Progress';
    }

    return status || 'Unknown';
  }

  get pageStart(): number {
    return this.totalRecords() === 0
      ? 0
      : (this.pageNumber - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(
      this.pageNumber * this.pageSize,
      this.totalRecords()
    );
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages() },
      (_, index) => index + 1
    );
  }
}
