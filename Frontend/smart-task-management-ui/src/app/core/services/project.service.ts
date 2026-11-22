
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  CreateProjectRequest,
  PagedResponse,
  Project,
  ProjectQuery,
  UpdateProjectRequest
} from '../models/project/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/projects`;

  getProjects(query: ProjectQuery): Observable<PagedResponse<Project>> {

    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('descending', query.descending ?? false);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }

    return this.http
      .get<ApiResponse<PagedResponse<Project>>>(this.apiUrl, { params })
      .pipe(map(response => response.data));
  }

  getProjectById(id: string): Observable<Project> {

    return this.http
      .get<ApiResponse<Project>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  createProject(request: CreateProjectRequest): Observable<Project> {

    return this.http
      .post<ApiResponse<Project>>(this.apiUrl, request)
      .pipe(map(response => response.data));
  }

  updateProject(
    id: string,
    request: UpdateProjectRequest
  ): Observable<Project> {

    return this.http
      .put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, request)
      .pipe(map(response => response.data));
  }

  deleteProject(id: string): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
