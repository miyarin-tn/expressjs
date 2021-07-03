export interface UserType {
  email: string;
  password: string;
  username?: string;
  firstname: string;
  lastname: string;
  phone?: string;
  birthday?: number;
  timezone: string;
  address?: string;
  status: string;
  role: string;
  activeCode?: string;
  activeCodeExpires?: number;
  createdAt: number;
  updatedAt: number;
}
