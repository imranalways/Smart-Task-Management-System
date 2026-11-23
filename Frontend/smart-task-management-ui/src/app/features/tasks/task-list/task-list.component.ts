
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  ImproveDescriptionResponse,
  TASK_PRIORITIES
} from '../../../core/models/task/task.model';

import { Project } from '../../../core/models/project/project.model';
import { TeamMember } from '../../../core/models/team-member/team-member.model';

import { AppModalComponent } from '../../../shared/components/app-modal/app-modal.component';

type AssignmentFilter = 'all' | 'mine' | 'unassigned';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    AppModalComponent
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

readonly createForm = this.fb.group({
  projectId: ['', Validators.required],
  title: ['', [Validators.required, Validators.maxLength(200)]],
  description: ['', Validators.required],
  priority: [2, Validators.required],
  dueDate: ['', Validators.required]
});  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  // Task and project data
  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);

  readonly loading = signal(false);
  readonly projectsLoading = signal(false);

  readonly errorMessage = signal('');
  readonly projectErrorMessage = signal('');

  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);

  // Assignment modal state
  readonly assignModalOpen = signal(false);
  readonly selectedTask = signal<Task | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly membersLoading = signal(false);
  readonly assigning = signal(false);
  readonly assignError = signal('');

  selectedUserId = '';

  // Create Task modal state
  readonly createModalOpen = signal(false);
  readonly creatingTask = signal(false);
  readonly improvingDescription = signal(false);

  readonly createError = signal('');
  readonly createSuccess = signal('');

  readonly priorities = TASK_PRIORITIES;

  // Create Task form
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

  // Pagination
  pageNumber = 1;
  pageSize = 10;

  // Search
  searchTerm = '';
  appliedSearch = '';

  // Sorting
  sortBy = 'dueDate';
  descending = false;

  // Dropdown filters
  selectedProjectId = '';

  assignmentFilter: AssignmentFilter =
    this.authService.getRole() === 'Admin' ? 'all' : 'mine';

  // Permissions
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
            const allProjects = [
              ...firstPageItems,
              ...responses.flatMap(
                response => response.items ?? []
              )
            ];

            this.projects.set(allProjects);
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

  // Improve task description using AI
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
    )
    .pipe(
      finalize(() => this.improvingDescription.set(false))
    )
    .subscribe({

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

  // Save new task
  saveTask(): void {
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

    this.taskService.createTask(request)
      .pipe(
        finalize(() => this.creatingTask.set(false))
      )
      .subscribe({

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
          member =>
            member.role?.toLowerCase() === 'teammember'
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

  // Assign task to selected team member
  assignTask(): void {
    const task = this.selectedTask();

    if (!task || !this.selectedUserId || this.assigning()) {
      return;
    }

    this.assigning.set(true);
    this.assignError.set('');

    this.taskService.assignTask(task.id, {
      userId: this.selectedUserId
    }).subscribe({

      next: () => {
        this.assigning.set(false);
        this.closeAssignModal();
        this.loadTasks();
      },

      error: error => {
        this.assigning.set(false);

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
  // DELETE TASK
  // ==========================================

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
          error?.error?.message ||
          'Failed to delete task.'
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

  // ==========================================
  // PRIORITY STYLING
  // ==========================================

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
