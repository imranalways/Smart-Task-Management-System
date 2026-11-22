
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedToUserId?: string | null;
  assignedToUserName: string;
}

export interface TaskQuery {
  pageNumber: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  descending?: boolean;
  projectId?: string;
  unassignedOnly?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description: string;
  priority: number;
  dueDate: string;
}

export interface UpdateTaskRequest {
  id: string;
  title: string;
  description: string;
  priority: number;
  dueDate: string;
}

export interface UpdateTaskStatusRequest {
  status: number;
}

export interface AssignTaskRequest {
  userId: string;
}

export const TASK_STATUSES = [
  { label: 'To Do', value: 1 },
  { label: 'In Progress', value: 2 },
  { label: 'Completed', value: 3 },
  { label: 'Cancelled', value: 4 }
];


export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description: string;
  priority: number;
  dueDate: string;
}

export interface ImproveDescriptionResponse {
  originalDescription: string;
  improvedDescription: string;
}

export interface ProjectOption {
  id: string;
  name: string;
}

export const TASK_PRIORITIES = [
  { label: 'Low', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'High', value: 3 },
  { label: 'Critical', value: 4 }
];
