
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'User' | 'Admin';
}

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<void>;
};

export enum Page {
  Login,
  Register,
  ForgotPassword,
  Home,
  Profile
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Alert {
  message: string;
  timestamp: string;
}

export type AlertContextType = {
  alerts: Alert[];
  addAlert: (message: string) => void;
};
