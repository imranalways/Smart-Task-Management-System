
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdByName: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');

    if (!projectId) {
      this.errorMessage.set('Project ID was not provided.');
      this.loading.set(false);
      return;
    }

    this.loadProject(projectId);
  }

  loadProject(id: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<ApiResponse<Project>>(
      `${environment.apiUrl}/projects/${id}`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.project.set(response.data);
        } else {
          this.errorMessage.set(
            response.message || 'Project information could not be found.'
          );
        }

        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Failed to load project details.'
        );

        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';

      case 'completed':
        return 'status-completed';

      case 'archived':
        return 'status-archived';

      default:
        return 'status-default';
    }
  }

  getProjectDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const difference = end.getTime() - start.getTime();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );
  }
}
