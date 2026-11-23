import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, finalize } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectMemberService } from '../../../core/services/project-member.service';
import { AuthService } from '../../../core/services/auth.service';

import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ImproveDescriptionResponse,
  TASK_PRIORITIES,
  TASK_STATUSES
} from '../../../core/models/task/task.model';

import { Project } from '../../../core/models/project/project.model';
import { TeamMember } from '../../../core/models/team-member/team-member.model';

import { AppModalComponent } from '../../../shared/components/app-modal/app-modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type AssignmentFilter = 'all' | 'mine' | 'unassigned';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    AppModalComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {

  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly projectMemberService = inject(ProjectMemberService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  // ==========================================
  // TASK AND PROJECT DATA
  // ==========================================

  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);

  readonly loading = signal(false);
  readonly projectsLoading = signal(false);

  readonly errorMessage = signal('');
  readonly projectErrorMessage = signal('');

  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);

  // ==========================================
  // COMMON CONSTANTS
  // ==========================================

  readonly priorities = TASK_PRIORITIES;
  readonly statuses = TASK_STATUSES;

  // ==========================================
  // PERMISSIONS
  // ==========================================

  get canAssignTasks(): boolean {
    const role = this.authService.getRole();
    return role === 'Admin' || role === 'ProjectManager';
  }

  get canUnassignTasks(): boolean {
    return this.canAssignTasks;
  }

  get canDeleteTasks(): boolean {
    return this.canAssignTasks;
  }

  get canEditTasks(): boolean {
    return this.canAssignTasks;
  }

  get canUpdateTasks(): boolean {
    const role = this.authService.getRole();
    return role === 'Admin' || role === 'ProjectManager';
  }

  // ==========================================
  // CREATE TASK MODAL
  // ==========================================

  readonly createModalOpen = signal(false);
  readonly creatingTask = signal(false);
  readonly improvingDescription = signal(false);

  readonly createError = signal('');
  readonly createSuccess = signal('');

  readonly createTaskForm = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150)
      ]
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(3000)
      ]
    ],
    priority: [2, Validators.required],
    dueDate: ['', Validators.required]
  });

  // ==========================================
  // VIEW TASK MODAL
  // ==========================================

  readonly viewModalOpen = signal(false);
  readonly viewTask = signal<Task | null>(null);
  readonly viewLoading = signal(false);
  readonly viewError = signal('');
  readonly viewSuccess = signal('');
  readonly viewStatusUpdating = signal(false);

  selectedStatus = 1;

  // ==========================================
  // EDIT TASK MODAL
  // ==========================================

  readonly editModalOpen = signal(false);
  readonly editLoading = signal(false);
  readonly editingTask = signal(false);
  readonly editImprovingDescription = signal(false);

  readonly editError = signal('');
  readonly editSuccess = signal('');

  private taskToEditId = '';

  readonly editTaskForm = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150)
      ]
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(3000)
      ]
    ],
    priority: [2, Validators.required],
    dueDate: ['', Validators.required]
  });

  // ==========================================
  // DELETE TASK CONFIRMATION
  // ==========================================

  readonly deleteDialogOpen = signal(false);
  readonly deletingTask = signal(false);
  readonly taskToDelete = signal<Task | null>(null);
  readonly deleteDialogMessage = signal('');

  // ==========================================
  // ASSIGN TASK MODAL
  // ==========================================

  readonly assignModalOpen = signal(false);
  readonly selectedTask = signal<Task | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly membersLoading = signal(false);
  readonly assigning = signal(false);
  readonly assignError = signal('');

  selectedUserId = '';

  // ==========================================
  // PAGINATION
  // ==========================================

  pageNumber = 1;
  pageSize = 10;

  // ==========================================
  // SEARCH
  // ==========================================

  searchTerm = '';
  appliedSearch = '';

  // ==========================================
  // SORTING
  // ==========================================

  sortBy = 'dueDate';
  descending = false;

  // ==========================================
  // FILTERS
  // ==========================================

  selectedProjectId = '';

  assignmentFilter: AssignmentFilter =
    this.authService.getRole() === 'Admin' ? 'all' : this.authService.getRole() === 'ProjectManager'? 'all': 'mine';

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  // ==========================================
  // PROJECT LOADING
  // ==========================================

  loadProjects(): void {
    this.projectsLoading.set(true);
    this.projectErrorMessage.set('');

    this.projectService.getProjects({
      pageNumber: 1,
      pageSize: 100,
      sortBy: 'name',
      descending: false
    }).subscribe({
      next: firstPage => {
        const firstPageItems = firstPage.items ?? [];

        if (firstPage.totalPages <= 1) {
          this.projects.set(firstPageItems);
          this.projectsLoading.set(false);
          return;
        }

        const remainingPages = Array.from(
          { length: firstPage.totalPages - 1 },
          (_, index) => index + 2
        );

        forkJoin(
          remainingPages.map(pageNumber =>
            this.projectService.getProjects({
              pageNumber,
              pageSize: 100,
              sortBy: 'name',
              descending: false
            })
          )
        ).subscribe({
          next: responses => {
            this.projects.set([
              ...firstPageItems,
              ...responses.flatMap(response => response.items ?? [])
            ]);
            this.projectsLoading.set(false);
          },
          error: () => {
            this.projects.set(firstPageItems);
            this.projectsLoading.set(false);
            this.projectErrorMessage.set(
              'Some projects could not be loaded.'
            );
          }
        });
      },
      error: error => {
        this.projectsLoading.set(false);
        this.projectErrorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load projects.'
        );
      }
    });
  }

  // ==========================================
  // TASK LOADING
  // ==========================================

  loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const query = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.appliedSearch || undefined,
      sortBy: this.sortBy,
      descending: this.descending,
      projectId: this.selectedProjectId || undefined,
      unassignedOnly: this.assignmentFilter === 'unassigned'
    };

    const request =
      this.assignmentFilter === 'mine'
        ? this.taskService.getMyTasks(query)
        : this.taskService.getTasks(query);

    request.subscribe({
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

  // ==========================================
  // CREATE TASK MODAL
  // ==========================================

  openCreateModal(): void {
    if (!this.canAssignTasks) {
      return;
    }

    this.createTaskForm.reset({
      projectId: '',
      title: '',
      description: '',
      priority: 2,
      dueDate: ''
    });

    this.createError.set('');
    this.createSuccess.set('');
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.creatingTask() || this.improvingDescription()) {
      return;
    }

    this.createModalOpen.set(false);
    this.createError.set('');
    this.createSuccess.set('');

    this.createTaskForm.reset({
      projectId: '',
      title: '',
      description: '',
      priority: 2,
      dueDate: ''
    });
  }

  improveTaskDescription(): void {
    const description =
      this.createTaskForm.controls.description.value.trim();

    if (description.length < 10) {
      this.createTaskForm.controls.description.markAsTouched();
      this.createError.set(
        'Enter at least 10 characters before improving the description.'
      );
      return;
    }

    this.improvingDescription.set(true);
    this.createError.set('');
    this.createSuccess.set('');

    this.http.post<ImproveDescriptionResponse>(
      `${this.apiUrl}/ai/improve-description`,
      { description }
    ).pipe(
      finalize(() => this.improvingDescription.set(false))
    ).subscribe({
      next: response => {
        this.createTaskForm.controls.description.setValue(
          response.improvedDescription
        );
        this.createSuccess.set(
          'Description improved successfully.'
        );
      },
      error: error => {
        this.createError.set(
          error?.error?.message ||
          'Unable to improve the description.'
        );
      }
    });
  }

  saveTask(): void {
    if (this.creatingTask()) {
      return;
    }

    this.createTaskForm.markAllAsTouched();
    this.createError.set('');
    this.createSuccess.set('');

    if (this.createTaskForm.invalid) {
      return;
    }

    const values = this.createTaskForm.getRawValue();

    const request: CreateTaskRequest = {
      projectId: values.projectId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: Number(values.priority),
      dueDate: new Date(
        `${values.dueDate}T12:00:00`
      ).toISOString()
    };

    this.creatingTask.set(true);

    this.taskService.createTask(request).pipe(
      finalize(() => this.creatingTask.set(false))
    ).subscribe({
      next: () => {
        this.createModalOpen.set(false);

        this.createTaskForm.reset({
          projectId: '',
          title: '',
          description: '',
          priority: 2,
          dueDate: ''
        });

        this.createError.set('');
        this.createSuccess.set('');

        this.pageNumber = 1;
        this.loadTasks();
      },
      error: error => {
        this.createError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to create task. Please try again.'
        );
      }
    });
  }

  // ==========================================
  // VIEW TASK MODAL
  // ==========================================

  openViewModal(task: Task): void {
    this.viewTask.set(null);
    this.viewError.set('');
    this.viewSuccess.set('');
    this.selectedStatus = 1;

    this.viewLoading.set(true);
    this.viewModalOpen.set(true);

    this.taskService.getTaskById(task.id).pipe(
      finalize(() => this.viewLoading.set(false))
    ).subscribe({
      next: latestTask => {
        this.viewTask.set(latestTask);
        this.selectedStatus = this.getStatusValue(latestTask.status);
      },
      error: error => {
        this.viewError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load task details.'
        );
      }
    });
  }

  closeViewModal(): void {
    if (this.viewStatusUpdating()) {
      return;
    }

    this.viewModalOpen.set(false);
    this.viewTask.set(null);
    this.viewError.set('');
    this.viewSuccess.set('');
  }

  updateViewTaskStatus(): void {
    const currentTask = this.viewTask();

    if (
      !currentTask ||
      this.viewStatusUpdating() ||
      (!this.canUpdateTasks && !currentTask.assignedToUserId)
    ) {
      return;
    }

    if (this.selectedStatus === this.getStatusValue(currentTask.status)) {
      return;
    }

    this.viewStatusUpdating.set(true);
    this.viewError.set('');
    this.viewSuccess.set('');

    this.taskService.updateStatus(
      currentTask.id,
      { status: this.selectedStatus }
    ).pipe(
      finalize(() => this.viewStatusUpdating.set(false))
    ).subscribe({
      next: () => {
        const updatedStatus = this.getStatusName(this.selectedStatus);

        this.viewTask.set({
          ...currentTask,
          status: updatedStatus
        });

        this.viewSuccess.set(
          'Task status updated successfully.'
        );

        this.loadTasks();
      },
      error: error => {
        this.viewError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to update task status.'
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

  private getStatusName(statusValue: number): string {
    const values: Record<number, string> = {
      1: 'Todo',
      2: 'InProgress',
      3: 'Completed',
      4: 'Cancelled'
    };

    return values[statusValue] ?? 'Todo';
  }

  // ==========================================
  // EDIT TASK MODAL
  // ==========================================

  openEditModal(task: Task): void {
    if (!this.canEditTasks && !task.assignedToUserId) {
      return;
    }

    this.taskToEditId = task.id;

    this.editError.set('');
    this.editSuccess.set('');

    this.editTaskForm.reset({
      title: '',
      description: '',
      priority: 2,
      dueDate: ''
    });

    this.editLoading.set(true);
    this.editModalOpen.set(true);

    this.taskService.getTaskById(task.id).pipe(
      finalize(() => this.editLoading.set(false))
    ).subscribe({
      next: latestTask => {
        this.editTaskForm.patchValue({
          title: latestTask.title,
          description: latestTask.description,
          priority: this.getPriorityValue(latestTask.priority),
          dueDate: this.toDateInputValue(latestTask.dueDate)
        });
      },
      error: error => {
        this.editError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load task for editing.'
        );
      }
    });
  }

  closeEditModal(): void {
    if (this.editingTask() || this.editImprovingDescription()) {
      return;
    }

    this.editModalOpen.set(false);
    this.editError.set('');
    this.editSuccess.set('');
    this.taskToEditId = '';
  }

  improveEditTaskDescription(): void {
    const description =
      this.editTaskForm.controls.description.value.trim();

    if (description.length < 10) {
      this.editTaskForm.controls.description.markAsTouched();
      this.editError.set(
        'Enter at least 10 characters before improving the description.'
      );
      return;
    }

    this.editImprovingDescription.set(true);
    this.editError.set('');
    this.editSuccess.set('');

    this.http.post<ImproveDescriptionResponse>(
      `${this.apiUrl}/ai/improve-description`,
      { description }
    ).pipe(
      finalize(() => this.editImprovingDescription.set(false))
    ).subscribe({
      next: response => {
        const descriptionControl =
          this.editTaskForm.controls.description;

        descriptionControl.setValue(response.improvedDescription);
        descriptionControl.markAsDirty();

        this.editSuccess.set(
          'Description improved successfully. Save the task to apply the changes.'
        );
      },
      error: error => {
        this.editError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to improve the description.'
        );
      }
    });
  }

  saveEditedTask(): void {
    if (
      this.editingTask() ||
      this.editLoading() ||
      this.editImprovingDescription()
    ) {
      return;
    }

    this.editTaskForm.markAllAsTouched();
    this.editError.set('');
    this.editSuccess.set('');

    if (this.editTaskForm.invalid || !this.taskToEditId) {
      return;
    }

    const values = this.editTaskForm.getRawValue();

    const request: UpdateTaskRequest = {
      id: this.taskToEditId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: Number(values.priority),
      dueDate: new Date(
        `${values.dueDate}T12:00:00`
      ).toISOString()
    };

    this.editingTask.set(true);

    this.taskService.updateTask(request).pipe(
      finalize(() => this.editingTask.set(false))
    ).subscribe({
      next: () => {
        this.editModalOpen.set(false);
        this.taskToEditId = '';
        this.loadTasks();
      },
      error: error => {
        this.editError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to update task. Please try again.'
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

  // ==========================================
  // DELETE TASK CONFIRMATION
  // ==========================================

  deleteTask(task: Task): void {
    if (!this.canDeleteTasks && !task.assignedToUserId) {
      return;
    }

    this.taskToDelete.set(task);
    this.deleteDialogMessage.set(
      `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`
    );
    this.deleteDialogOpen.set(true);
  }

  cancelDeleteTask(): void {
    if (this.deletingTask()) {
      return;
    }

    this.deleteDialogOpen.set(false);
    this.taskToDelete.set(null);
    this.deleteDialogMessage.set('');
  }

  confirmDeleteTask(): void {
    const task = this.taskToDelete();

    if (!task || this.deletingTask()) {
      return;
    }

    this.deletingTask.set(true);

    this.taskService.deleteTask(task.id).pipe(
      finalize(() => this.deletingTask.set(false))
    ).subscribe({
      next: () => {
        this.deleteDialogOpen.set(false);
        this.taskToDelete.set(null);
        this.deleteDialogMessage.set('');

        if (this.tasks().length === 1 && this.pageNumber > 1) {
          this.pageNumber--;
        }

        this.loadTasks();
      },
      error: error => {
        this.deleteDialogMessage.set(
          error?.error?.message ||
          error?.message ||
          'Unable to delete this task. Please try again.'
        );
      }
    });
  }

  // ==========================================
  // FILTERS
  // ==========================================

  onProjectFilterChange(): void {
    this.pageNumber = 1;
    this.loadTasks();
  }

  onAssignmentFilterChange(): void {
    this.pageNumber = 1;
    this.loadTasks();
  }

  // ==========================================
  // SEARCH
  // ==========================================

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

  // ==========================================
  // PAGINATION
  // ==========================================

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

  // ==========================================
  // SORTING
  // ==========================================

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

  // ==========================================
  // ASSIGN TASK MODAL
  // ==========================================

  openAssignModal(task: Task): void {
    if (!this.canAssignTasks) {
      return;
    }

    this.selectedTask.set(task);
    this.selectedUserId = '';
    this.teamMembers.set([]);
    this.assignError.set('');

    this.assignModalOpen.set(true);
    this.membersLoading.set(true);

    this.projectMemberService.getMembers(task.projectId).subscribe({
      next: members => {
        const eligibleMembers = (members ?? []).filter(
          member => member.role?.toLowerCase() === 'teammember'
        );

        this.teamMembers.set(eligibleMembers);
        this.membersLoading.set(false);
      },
      error: error => {
        this.membersLoading.set(false);
        this.assignError.set(
          error?.error?.message ||
          error?.message ||
          'Unable to load project team members.'
        );
      }
    });
  }

  assignTask(): void {
    const task = this.selectedTask();

    if (!task || !this.selectedUserId || this.assigning()) {
      return;
    }

    this.assigning.set(true);
    this.assignError.set('');

    this.taskService.assignTask(task.id, {
      userId: this.selectedUserId
    }).pipe(
      finalize(() => this.assigning.set(false))
    ).subscribe({
      next: () => {
        this.closeAssignModal();
        this.loadTasks();
      },
      error: error => {
        this.assignError.set(
          error?.error?.message ||
          error?.message ||
          'Failed to assign the task. Please try again.'
        );
      }
    });
  }

  closeAssignModal(): void {
    if (this.assigning()) {
      return;
    }

    this.assignModalOpen.set(false);
    this.selectedTask.set(null);
    this.teamMembers.set([]);
    this.selectedUserId = '';
    this.assignError.set('');
  }

  // ==========================================
  // UNASSIGN TASK
  // ==========================================

  unassignTask(task: Task): void {
    if (!this.canUnassignTasks || !task.assignedToUserId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to unassign "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.taskService.unassignTask(task.id).subscribe({
      next: () => {
        if (this.tasks().length === 1 && this.pageNumber > 1) {
          this.pageNumber--;
        }

        this.loadTasks();
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Failed to unassign task.'
        );
      }
    });
  }

  // ==========================================
  // STATUS STYLING
  // ==========================================

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

  // ==========================================
  // PAGINATION DISPLAY
  // ==========================================

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