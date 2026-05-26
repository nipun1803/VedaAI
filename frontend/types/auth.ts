export interface AuthUser {
  id: string;
  email: string;
  name: string;
  schoolName: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}
