
import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { DashboardService } from '../../../core/services/dashboard.service';

import {
  DashboardSummary,
  TaskStatusCount,
  TaskPriorityCount
} from '../../../core/models/dashboard/dashboard-summary.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private readonly dashboardService = inject(DashboardService);

  // Current date for dashboard header
  readonly today: Date = new Date();

  // Dashboard state
  readonly summary = signal<DashboardSummary | null>(null);

  readonly loading = signal<boolean>(true);

  readonly errorMessage = signal<string | null>(null);

  // Computed values
  readonly completionRate = computed(() => {
    const data = this.summary();

    if (!data || data.totalTasks === 0) {
      return 0;
    }

    return Math.round(
      (data.completedTasks / data.totalTasks) * 100
    );
  });

  readonly pendingPercentage = computed(() => {
    const data = this.summary();

    if (!data || data.totalTasks === 0) {
      return 0;
    }

    return Math.round(
      (data.pendingTasks / data.totalTasks) * 100
    );
  });

  // Task status chart
  readonly statusChartBackground = computed(() => {

    const statuses = this.summary()?.tasksByStatus ?? [];

    const colors: Record<string, string> = {
      'ToDo': '#94a3b8',
      'To Do': '#94a3b8',
      'InProgress': '#6478ed',
      'In Progress': '#6478ed',
      'Completed': '#22b98a',
      'Cancelled': '#f16c7b'
    };

    const total = statuses.reduce(
      (sum, item) => sum + item.count,
      0
    );

    if (total === 0) {
      return 'conic-gradient(#edf0f6 0deg 360deg)';
    }

    let currentDegree = 0;

    const segments = statuses
      .filter(item => item.count > 0)
      .map(item => {

        const start = currentDegree;

        const end =
          start + (item.count / total) * 360;

        currentDegree = end;

        const color =
          colors[item.status] ?? '#a78bfa';

        return `${color} ${start}deg ${end}deg`;
      });

    return `conic-gradient(${segments.join(', ')})`;
  });

  // Component initialization
  ngOnInit(): void {
    this.loadDashboard();
  }

  // Load dashboard summary from API
  loadDashboard(): void {

    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getSummary().subscribe({

      next: (data: DashboardSummary) => {

        this.summary.set(data);
        this.loading.set(false);

      },

      error: (error) => {

        console.error(
          'Dashboard loading failed:',
          error
        );

        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load dashboard data. Please try again.'
        );

        this.loading.set(false);

      }

    });
  }

  // Get status color
  getStatusColor(status: string): string {

    const colors: Record<string, string> = {
      'ToDo': '#94a3b8',
      'To Do': '#94a3b8',
      'InProgress': '#6478ed',
      'In Progress': '#6478ed',
      'Completed': '#22b98a',
      'Cancelled': '#f16c7b'
    };

    return colors[status] ?? '#a78bfa';
  }

  // Get priority color
  getPriorityColor(priority: string): string {

    const colors: Record<string, string> = {
      'Low': '#22b98a',
      'Medium': '#6478ed',
      'High': '#f59e0b',
      'Critical': '#ef5261'
    };

    return colors[priority] ?? '#94a3b8';
  }

  // Calculate priority percentage
  getPriorityPercentage(item: TaskPriorityCount): number {

    const total = this.summary()?.totalTasks ?? 0;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (item.count / total) * 100
    );
  }

  // Calculate status percentage
  getStatusPercentage(item: TaskStatusCount): number {

    const total = this.summary()?.totalTasks ?? 0;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (item.count / total) * 100
    );
  }

  // Format task status
  formatStatus(status: string): string {

    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  // Format due date
  formatDueDate(date: string): string {

    const dueDate = new Date(date);

    if (isNaN(dueDate.getTime())) {
      return 'Invalid date';
    }

    return dueDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  // Check overdue tasks
  isOverdue(date: string): boolean {

    const dueDate = new Date(date);

    if (isNaN(dueDate.getTime())) {
      return false;
    }

    return dueDate.getTime() < Date.now();
  }

  // Track status items
  trackByStatus(
    index: number,
    item: TaskStatusCount
  ): string {
    return item.status;
  }

  // Track priority items
  trackByPriority(
    index: number,
    item: TaskPriorityCount
  ): string {
    return item.priority;
  }
}
