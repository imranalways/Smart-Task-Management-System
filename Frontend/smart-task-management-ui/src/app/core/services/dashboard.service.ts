
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  DashboardSummary
} from '../models/dashboard/dashboard-summary.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummary> {

    return this.http
      .get<ApiResponse<DashboardSummary>>(
        `${this.apiUrl}/summary`
      )
      .pipe(
        map(response => {

          if (!response.success || !response.data) {
            throw new Error(
              response.message || 'Unable to load dashboard summary.'
            );
          }

          return response.data;
        })
      );
  }
}
