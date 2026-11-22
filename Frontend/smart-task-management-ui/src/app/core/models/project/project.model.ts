
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdByName: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProjectRequest {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface PagedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface ProjectQuery {
  pageNumber: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  descending?: boolean;
}
export type ProjectListResponse = PagedResponse<Project>;