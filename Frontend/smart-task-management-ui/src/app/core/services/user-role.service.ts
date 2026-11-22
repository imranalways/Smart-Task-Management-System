
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  ManagedRole,
  ManagedUser
} from '../models/user-role/user-role.model';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/user-roles`;

  getUsers(): Observable<ManagedUser[]> {
    return this.http
      .get<ApiResponse<ManagedUser[]>>(`${this.apiUrl}/users`)
      .pipe(map(response => this.unwrap(response)));
  }

  getRoles(): Observable<ManagedRole[]> {
    return this.http
      .get<ApiResponse<ManagedRole[]>>(`${this.apiUrl}/roles`)
      .pipe(map(response => this.unwrap(response)));
  }

  updateRole(userId: string, role: string): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(
        `${this.apiUrl}/users/${userId}`,
        { role }
      )
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Unable to update role.');
          }
          return undefined;
        })
      );
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response?.success || response.data == null) {
      throw new Error(response?.message || 'Request failed.');
    }

    return response.data;
  }
}
