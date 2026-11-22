
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';

import {
  Project,
  ProjectListResponse
} from '../../../core/models/project/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {

  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  // State
  readonly projects = signal<Project[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Search and pagination
  searchTerm = '';
  pageNumber = 1;
  pageSize = 10;

  totalRecords = 0;
  totalPages = 0;

  // Sorting
  sortBy = 'name';
  descending = false;

  ngOnInit(): void {
    this.loadProjects();
  }

  // Load projects
  loadProjects(): void {

    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectService.getProjects({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.searchTerm,
      sortBy: this.sortBy,
      descending: this.descending
    })
    .pipe(
      finalize(() => this.loading.set(false))
    )
    .subscribe({

      next: (response: ProjectListResponse) => {

        this.projects.set(response.items ?? []);

        this.totalRecords = response.totalRecords;
        this.totalPages = response.totalPages;
        this.pageNumber = response.pageNumber;

      },

      error: (error) => {

        console.error('Project loading failed:', error);

        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load projects. Please try again.'
        );

      }

    });
  }

  // Search projects
  searchProjects(): void {
    this.pageNumber = 1;
    this.loadProjects();
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.loadProjects();
  }

  // Sort projects
  changeSort(field: string): void {

    if (this.sortBy === field) {
      this.descending = !this.descending;
    } else {
      this.sortBy = field;
      this.descending = false;
    }

    this.loadProjects();
  }

  // Pagination
  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.pageNumber
    ) {
      return;
    }

    this.pageNumber = page;
    this.loadProjects();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.pageNumber = 1;
    this.loadProjects();
  }

  // Navigation
  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

  editProject(id: string): void {
    this.router.navigate(['/projects/edit', id]);
  }

  viewProject(id: string): void {
    this.router.navigate(['/projects/details', id]);
  }

  // Delete project
  deleteProject(project: Project): void {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.projectService.deleteProject(project.id)
      .subscribe({

        next: () => {
          this.loadProjects();
        },

        error: (error) => {

          console.error('Project deletion failed:', error);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to delete this project.'
          );

        }

      });
  }

  // Status styling
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

  // Date formatting
  formatDate(date: string): string {

    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  get firstRecord(): number {
    return this.totalRecords === 0
      ? 0
      : (this.pageNumber - 1) * this.pageSize + 1;
  }

  get lastRecord(): number {
    return Math.min(
      this.pageNumber * this.pageSize,
      this.totalRecords
    );
  }

  get pageNumbers(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }
}
