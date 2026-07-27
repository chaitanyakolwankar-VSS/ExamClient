import apiClient from "../api/Client";

export interface LoginRequest {
  // Email is the login identifier: usernames are only unique within a college,
  // so they cannot identify a user across colleges.
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    email: string;
    role: string;
    isPlatformAdmin: boolean;
  };
  college: {
    collegeId: string;
    name: string;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Calls POST /api/Auth/login
    const response = await apiClient.post<LoginResponse>(
      "/Auth/login",
      credentials,
    );
    return response.data;
  },
};
