
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  TeamMember,
  UserDirectory
} from '../models/team-member/team-member.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectMemberService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  getMembers(projectId: string): Observable<TeamMember[]> {
    return this.http.get<ApiResponse<TeamMember[]>>(
      `${this.apiUrl}/projects/${projectId}/members`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }

        return response.data ?? [];
      })
    );
  }

  getAvailableUsers(): Observable<UserDirectory[]> {
    return this.http.get<ApiResponse<UserDirectory[]>>(
      `${this.apiUrl}/users`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }

        return response.data ?? [];
      })
    );
  }

  addMember(projectId: string, userId: string): Observable<void> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/projects/${projectId}/members`,
      { userId }
    ).pipe(
      map(() => undefined)
    );
  }

  removeMember(
    projectId: string,
    userId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/projects/${projectId}/members/${userId}`
    );
  }
}
