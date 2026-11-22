
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ManagedRole,
  ManagedUser
} from '../../core/models/user-role/user-role.model';

import { UserRoleService } from '../../core/services/user-role.service';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-roles.component.html',
  styleUrl: './user-roles.component.scss'
})
export class UserRolesComponent implements OnInit {

  private readonly userRoleService = inject(UserRoleService);

  // Users and roles
  users = signal<ManagedUser[]>([]);
  roles = signal<ManagedRole[]>([]);

  // UI states
  loading = signal<boolean>(false);
  savingUserId = signal<string | null>(null);

  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Role selections
  selectedRoles = signal<Record<string, string>>({});

  // Search
  searchEmail = '';
  appliedEmailSearch = signal<string>('');

  // Filter users by email
  filteredUsers = computed(() => {

    const search = this.appliedEmailSearch()
      .trim()
      .toLowerCase();

    if (!search) {
      return this.users();
    }

    return this.users().filter(user =>
      user.email.toLowerCase().includes(search)
    );
  });

  // Statistics
  totalUsers = computed(() => this.users().length);

  adminCount = computed(() =>
    this.users().filter(user => user.role === 'Admin').length
  );

  managerCount = computed(() =>
    this.users().filter(user => user.role === 'ProjectManager').length
  );

  memberCount = computed(() =>
    this.users().filter(user => user.role === 'TeamMember').length
  );

  ngOnInit(): void {
    this.loadData();
  }

  // Load users and roles
  loadData(): void {

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userRoleService.getRoles().subscribe({
      next: roles => {
        this.roles.set(roles);
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message || 'Unable to load available roles.'
        );
      }
    });

    this.userRoleService.getUsers().subscribe({
      next: users => {

        this.users.set(users);

        const selections: Record<string, string> = {};

        users.forEach(user => {
          selections[user.id] = user.role;
        });

        this.selectedRoles.set(selections);
        this.loading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error?.error?.message || 'Unable to load users.'
        );

        this.loading.set(false);
      }
    });
  }

  // Search users by email
  searchUsers(): void {

    this.appliedEmailSearch.set(
      this.searchEmail.trim().toLowerCase()
    );
  }

  // Clear search
  clearSearch(): void {

    this.searchEmail = '';
    this.appliedEmailSearch.set('');
  }

  // Change selected role
  changeSelection(userId: string, role: string): void {

    this.selectedRoles.update(current => ({
      ...current,
      [userId]: role
    }));

    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // Check whether role has changed
  hasChanged(user: ManagedUser): boolean {

    return this.selectedRoles()[user.id] !== user.role;
  }

  // Save role assignment
  saveRole(user: ManagedUser): void {

    const newRole = this.selectedRoles()[user.id];

    if (!newRole || newRole === user.role) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to assign the ${this.getRoleLabel(newRole)} role to ${user.fullName}?`
    );

    if (!confirmed) {
      this.resetSelection(user);
      return;
    }

    this.savingUserId.set(user.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Pass role as a string because the service expects a string.
    this.userRoleService.updateRole(user.id, newRole).subscribe({

      next: () => {

        this.users.update(users =>
          users.map(existingUser =>
            existingUser.id === user.id
              ? { ...existingUser, role: newRole }
              : existingUser
          )
        );

        this.selectedRoles.update(current => ({
          ...current,
          [user.id]: newRole
        }));

        this.successMessage.set(
          `Role successfully updated for ${user.email}.`
        );

        this.savingUserId.set(null);
      },

      error: error => {

        this.errorMessage.set(
          error?.error?.message || 'Failed to update user role.'
        );

        this.savingUserId.set(null);
        this.resetSelection(user);
      }
    });
  }

  // Reset role selection
  resetSelection(user: ManagedUser): void {

    this.selectedRoles.update(current => ({
      ...current,
      [user.id]: user.role
    }));
  }

  // Role display name
  getRoleLabel(role: string): string {

    switch (role) {

      case 'Admin':
        return 'Administrator';

      case 'ProjectManager':
        return 'Project Manager';

      case 'TeamMember':
        return 'Team Member';

      default:
        return role;
    }
  }

  // Role badge CSS class
  getRoleClass(role: string): string {

    switch (role) {

      case 'Admin':
        return 'role-admin';

      case 'ProjectManager':
        return 'role-manager';

      case 'TeamMember':
        return 'role-member';

      default:
        return '';
    }
  }

  trackByUserId(index: number, user: ManagedUser): string {
    return user.id;
  }
}
