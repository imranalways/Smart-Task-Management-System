
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';

import {
  Project,
  ProjectListResponse,
  CreateProjectRequest,
  UpdateProjectRequest
} from '../../../core/models/project/project.model';

import { AppModalComponent } from '../../../shared/components/app-modal/app-modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type ProjectModalMode = 'create' | 'edit' | 'details' | null;

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppModalComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {

  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  // Project list state
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Modal state
  readonly modalMode = signal<ProjectModalMode>(null);
  readonly selectedProject = signal<Project | null>(null);
  readonly formError = signal('');

  readonly saving = signal(false);

  // Delete confirmation state
  readonly showDeleteDialog = signal(false);
  readonly deleting = signal(false);
  readonly projectToDelete = signal<Project | null>(null);

  // Project form
  readonly projectForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]
    ],
    status: [1, Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  readonly statuses = [
    { label: 'Active', value: 1 },
    { label: 'Completed', value: 2 },
    { label: 'Archived', value: 3 }
  ];

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

  // Search
  searchProjects(): void {
    this.pageNumber = 1;
    this.loadProjects();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.loadProjects();
  }

  // Sorting
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

  // Open Create Modal
  createProject(): void {

    this.selectedProject.set(null);
    this.formError.set('');

    this.projectForm.reset({
      name: '',
      description: '',
      status: 1,
      startDate: '',
      endDate: ''
    });

    this.modalMode.set('create');
  }

  // Open Edit Modal
  editProject(project: Project): void {

    this.selectedProject.set(project);
    this.formError.set('');

    this.projectForm.reset({
      name: project.name,
      description: project.description,
      status: this.getStatusValue(project.status),
      startDate: this.toDateInputValue(project.startDate),
      endDate: this.toDateInputValue(project.endDate)
    });

    this.modalMode.set('edit');
  }

  // Open Details Modal
  viewProject(project: Project): void {
    this.selectedProject.set(project);
    this.modalMode.set('details');
  }

  // Close Project Modal
  closeProjectModal(): void {

    if (this.saving()) {
      return;
    }

    this.modalMode.set(null);
    this.selectedProject.set(null);
    this.formError.set('');
    this.projectForm.reset();
  }

  // Save Project
  saveProject(): void {

    this.projectForm.markAllAsTouched();
    this.formError.set('');

    if (this.projectForm.invalid) {
      return;
    }

    const formValue = this.projectForm.getRawValue();

    if (new Date(formValue.endDate) < new Date(formValue.startDate)) {
      this.formError.set(
        'End date cannot be earlier than start date.'
      );
      return;
    }

    const request = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      startDate: `${formValue.startDate}T00:00:00`,
      endDate: `${formValue.endDate}T00:00:00`
    };

    this.saving.set(true);

    if (this.modalMode() === 'create') {

      const createRequest: CreateProjectRequest = request;

      this.projectService.createProject(createRequest)
        .pipe(
          finalize(() => this.saving.set(false))
        )
        .subscribe({

          next: () => {
            this.closeAfterSave();
            this.pageNumber = 1;
            this.loadProjects();
          },

          error: (error) => {
            console.error('Project creation failed:', error);

            this.formError.set(
              error?.error?.message ||
              'Failed to create project. Please try again.'
            );
          }

        });

      return;
    }

    const project = this.selectedProject();

    if (!project) {
      this.saving.set(false);
      this.formError.set('Project information is missing.');
      return;
    }

    const updateRequest: UpdateProjectRequest = {
      ...request,
      status: Number(formValue.status)
    };

    this.projectService.updateProject(project.id, updateRequest)
      .pipe(
        finalize(() => this.saving.set(false))
      )
      .subscribe({

        next: () => {
          this.closeAfterSave();
          this.loadProjects();
        },

        error: (error) => {
          console.error('Project update failed:', error);

          this.formError.set(
            error?.error?.message ||
            'Failed to update project. Please try again.'
          );
        }

      });
  }

  private closeAfterSave(): void {
    this.modalMode.set(null);
    this.selectedProject.set(null);
    this.formError.set('');
    this.projectForm.reset();
  }

  // Delete Project: open confirmation
  deleteProject(project: Project): void {
    this.projectToDelete.set(project);
    this.showDeleteDialog.set(true);
  }

  // Delete Project: confirmed action
  confirmDelete(): void {

    const project = this.projectToDelete();

    if (!project || this.deleting()) {
      return;
    }

    this.deleting.set(true);

    this.projectService.deleteProject(project.id)
      .pipe(
        finalize(() => this.deleting.set(false))
      )
      .subscribe({

        next: () => {

          this.showDeleteDialog.set(false);
          this.projectToDelete.set(null);

          // Return to previous page if the current page becomes empty.
          if (
            this.projects().length === 1 &&
            this.pageNumber > 1
          ) {
            this.pageNumber--;
          }

          this.loadProjects();
        },

        error: (error) => {

          console.error('Project deletion failed:', error);

          this.showDeleteDialog.set(false);
          this.projectToDelete.set(null);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to delete this project.'
          );

        }

      });
  }

  cancelDelete(): void {

    if (this.deleting()) {
      return;
    }

    this.showDeleteDialog.set(false);
    this.projectToDelete.set(null);
  }

  // Edit from details modal
  editSelectedProject(): void {

    const project = this.selectedProject();

    if (!project) {
      return;
    }

    this.editProject(project);
  }

  // Status conversion
  getStatusValue(status: string | number): number {

    if (typeof status === 'number') {
      return status;
    }

    switch (status?.toLowerCase()) {
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

  formatDate(date: string): string {

    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private toDateInputValue(date: string): string {

    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
