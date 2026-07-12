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

export const permissionService = {
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

