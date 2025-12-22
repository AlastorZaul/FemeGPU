export type UserRole = 'ADMIN' | 'USER' | 'VIEWER';

// Utilisé pour l'affichage et la session
export interface User {
  id?: string;
  username: string;
  email: string;
  roles: UserRole[];
  avatar?: string;    // Pour l'image de profil
  token?: string;     // Optionnel si on gère des tokens JWT
}

// Utilisé pour le formulaire de login
export interface LoginCredentials {
  username: string;
  password: string;
}

// (Optionnel) Je garde votre ancienne interface pour ne pas casser le reste du code
// si d'autres composants l'utilisaient, mais l'idéal est de migrer vers 'User'
export interface UserProfile extends User {
  icon?: string;
  description?: string;
}
