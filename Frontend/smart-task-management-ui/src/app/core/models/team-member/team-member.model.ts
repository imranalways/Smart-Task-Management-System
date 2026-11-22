export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface UserDirectory {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ProjectOption {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}