
export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: string;
}

export interface ManagedRole {
  name: string;
  displayName: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
