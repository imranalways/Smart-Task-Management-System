
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  Task,
  TaskQuery,
  PagedResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AssignTaskRequest
} from '../models/task/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  getTasks(query: TaskQuery): Observable<PagedResponse<Task>> {
  const params = this.buildTaskParams(query);

  return this.http
    .get<ApiResponse<PagedResponse<Task>>>(this.apiUrl, { params })
    .pipe(map(response => this.unwrap(response)));
}

getMyTasks(query: TaskQuery): Observable<PagedResponse<Task>> {
  const params = this.buildTaskParams(query);

  return this.http
    .get<ApiResponse<PagedResponse<Task>>>(`${this.apiUrl}/my`, { params })
    .pipe(map(response => this.unwrap(response)));
}

unassignTask(id: string): Observable<unknown> {
  return this.http.delete<ApiResponse<unknown>>(
    `${this.apiUrl}/${id}/assign`
  );
}

private buildTaskParams(query: TaskQuery): HttpParams {
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

  if (query.projectId) {
    params = params.set('projectId', query.projectId);
  }

  if (query.unassignedOnly) {
    params = params.set('unassignedOnly', true);
  }

  return params;
}

  getTaskById(id: string): Observable<Task> {
    return this.http
      .get<ApiResponse<Task>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => this.unwrap(response)));
  }

  createTask(request: CreateTaskRequest): Observable<Task> {
    return this.http
      .post<ApiResponse<Task>>(this.apiUrl, request)
      .pipe(map(response => this.unwrap(response)));
  }

  updateTask(request: UpdateTaskRequest): Observable<Task> {
    return this.http
      .put<ApiResponse<Task>>(`${this.apiUrl}/${request.id}`, request)
      .pipe(map(response => this.unwrap(response)));
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(
    id: string,
    request: UpdateTaskStatusRequest
  ): Observable<unknown> {
    return this.http.put<ApiResponse<unknown>>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }

  assignTask(
    id: string,
    request: AssignTaskRequest
  ): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.apiUrl}/${id}/assign`,
      request
    );
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response?.success || response.data === undefined) {
      throw new Error(response?.message || 'Request failed.');
    }

    return response.data;
  }
}
