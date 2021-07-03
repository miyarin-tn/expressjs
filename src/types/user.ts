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
  appleId?: string,
  facebookId?: string,
  googleId?: string,
  avatar?: string,
  status: string;
  role: string;
  activeCode?: string;
  activeCodeExpires?: number;
  createdAt: number;
  updatedAt: number;
};

export interface SocialType {
  id: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar?: string;
  timezone: string;
};
