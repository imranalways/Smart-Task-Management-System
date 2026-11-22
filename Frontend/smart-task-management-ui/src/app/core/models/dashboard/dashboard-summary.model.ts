
export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasksByStatus: TaskStatusCount[];
  tasksByPriority: TaskPriorityCount[];
  upcomingDueTasks: UpcomingTask[];
}

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface TaskPriorityCount {
  priority: string;
  count: number;
}

export interface UpcomingTask {
  taskId: string;
  title: string;
  dueDate: string;
  projectName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
