import apiClient from "../api/Client";

export interface CreateUserPayload {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  roleId?: string | null;
  collegeId: string | null;
}

export interface UserListResponse {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface UserDetailsResponse {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string | null;
  collegeID: string | null;
}

export async function getUserById(id: string): Promise<UserDetailsResponse> {
  const response = await apiClient.get<UserDetailsResponse>(
    `UserMaster/GetAll/${id}`,
  );
  return response.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post("/UserMaster", payload);
  return response.data;
}

export async function getUsers(): Promise<UserListResponse[]> {
  const response = await apiClient.get<UserListResponse[]>(
    "/UserMaster/GetInfo",
  );
  return response.data;
}

export async function deleteUser(id: string) {
  const response = await apiClient.delete(`/UserMaster/DeleteUser/${id}`);
  return response.data;
}

export async function updateUser(payload: {
  userId: string | null;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  roleid?: string | null;
}) {
  const response = await apiClient.put("UserMaster/Update", payload);
  return response.data;
}
