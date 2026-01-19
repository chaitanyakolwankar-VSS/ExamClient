import apiClient from "../api/Client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    email: string; 
    role: string;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Calls POST /api/Auth/login
    const response = await apiClient.post<LoginResponse>('/Auth/login', credentials);
    return response.data;
  },
};