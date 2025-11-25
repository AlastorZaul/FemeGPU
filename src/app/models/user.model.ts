export type UserRole = 'ADMIN' | 'USER' | 'VIEWER';

export interface UserProfile {
  username: string;
  email: string;
  roles: UserRole[]; // Un utilisateur peut avoir plusieurs rôles
  token: string;     // Le token simulé (JWT)
}
