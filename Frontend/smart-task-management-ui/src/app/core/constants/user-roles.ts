
export const UserRoles = {
  Admin: 'Admin',
  ProjectManager: 'ProjectManager',
  TeamMember: 'TeamMember'
} as const;

export type UserRole =
  typeof UserRoles[keyof typeof UserRoles];
