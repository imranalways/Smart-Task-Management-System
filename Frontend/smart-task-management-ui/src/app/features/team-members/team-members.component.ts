
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

import { ProjectMemberService } from '../../core/services/project-member.service';

import {
  ApiResponse,
  ProjectOption,
  TeamMember,
  UserDirectory
} from '../../core/models/team-member/team-member.model';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-members.component.html',
  styleUrl: './team-members.component.scss'
})
export class TeamMembersComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly memberService = inject(ProjectMemberService);

  readonly projects = signal<ProjectOption[]>([]);
  readonly members = signal<TeamMember[]>([]);
  readonly availableUsers = signal<UserDirectory[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  selectedProjectId = '';
  selectedUserId = '';

  ngOnInit(): void {
    this.loadProjects();
    this.loadAvailableUsers();
  }

  loadProjects(): void {
    const params = new HttpParams()
      .set('pageNumber', 1)
      .set('pageSize', 100);

    this.http.get<ApiResponse<{ items: ProjectOption[] }>>(
      `${environment.apiUrl}/projects`,
      { params }
    ).subscribe({
      next: response => {
        this.projects.set(response.data?.items ?? []);

        if (this.projects().length > 0) {
          this.selectedProjectId = this.projects()[0].id;
          this.loadMembers();
        }
      },
      error: () => {
        this.errorMessage.set('Unable to load projects.');
      }
    });
  }

  loadAvailableUsers(): void {
    this.memberService.getAvailableUsers().subscribe({
      next: users => this.availableUsers.set(users),
      error: () => {
        this.errorMessage.set('Unable to load available users.');
      }
    });
  }

  loadMembers(): void {
    if (!this.selectedProjectId) {
      this.members.set([]);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.memberService.getMembers(this.selectedProjectId).subscribe({
      next: members => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Unable to load team members.'
        );
        this.loading.set(false);
      }
    });
  }

  onProjectChange(): void {
    this.members.set([]);
    this.loadMembers();
  }

  get filteredUsers(): UserDirectory[] {
    const memberIds = new Set(
      this.members().map(member => member.userId)
    );

    return this.availableUsers().filter(
      user => !memberIds.has(user.id)
    );
  }

  addMember(): void {
    if (!this.selectedProjectId || !this.selectedUserId) {
      this.errorMessage.set('Please select a user.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.memberService.addMember(
      this.selectedProjectId,
      this.selectedUserId
    ).subscribe({
      next: () => {
        this.successMessage.set('Team member added successfully.');
        this.selectedUserId = '';
        this.saving.set(false);

        this.loadMembers();
        this.loadAvailableUsers();
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Unable to add team member.'
        );
        this.saving.set(false);
      }
    });
  }

  removeMember(member: TeamMember): void {
    const confirmed = window.confirm(
      `Remove ${member.fullName} from this project?`
    );

    if (!confirmed) {
      return;
    }

    this.memberService.removeMember(
      this.selectedProjectId,
      member.userId
    ).subscribe({
      next: () => {
        this.successMessage.set('Team member removed successfully.');
        this.loadMembers();
        this.loadAvailableUsers();
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Unable to remove team member.'
        );
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  trackByUserId(_: number, member: TeamMember): string {
    return member.userId;
  }
}
