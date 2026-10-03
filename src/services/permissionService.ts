import apiClient from "../api/Client";

export interface PermissionCreateRequest {
  permissionFormName: string;
  permissionModuleName: string;
}


export interface PermissionGroup {
  permissionModuleName: string;
  permissionForms: {
    permissionId: string;
    permissionFormName: string;
  }[];
}

export interface AllowedFormResponse {
  permissionId: string;
  permissionModuleName: string;
  permissionFormName: string;
}

export const permissionService = {
  /** Forms the signed-in user may open (role permissions + user permissions). Open to every signed-in user. */
  async getMyAllowedForms(): Promise<AllowedFormResponse[]> {
    const res = await apiClient.get<AllowedFormResponse[]>("/Permission/me");
    return res.data;
  },

  async getGroupedPermissions(): Promise<PermissionGroup[]> {
    const res = await apiClient.get("/Permission/grouped");
    return res.data;
  },

  async createPermission(data: {
    permissionModuleName: string;
    permissionFormName: string;
  }) {
    return apiClient.post("/Permission", data);
  },

  async updatePermission(
    id: string,
    formName: string
  ) {
    return apiClient.put(`/Permission/${id}`, {
      permissionFormName: formName,
    });
  },

  async deletePermission(id: string) {
    return apiClient.delete(`/Permission/${id}`);
  },
};

