

import apiClient from "../api/Client";

// ---------- DTOs ----------
export interface RoleMasterResponse {
  roleId: string;
  name: string;
  description: string;
  permissionFormNames: string;
  permissionForms: string;
}

export interface PermissionResponse {
  permissionId: string;
  permissionModuleName: string;
  permissionFormName: string;
}

// ---------- ROLE SERVICE ----------
export const RoleMasterService = {
  // GET ALL ROLES
  async GetRoles(): Promise<RoleMasterResponse[]> {
    const response = await apiClient.get<RoleMasterResponse[]>("/RoleMaster/GetInfo");
    return response.data;
  },

  // GET PERMISSIONS
  async GetPermissions(): Promise<PermissionResponse[]> {
    const response = await apiClient.get<PermissionResponse[]>("/RoleMaster/Selectmodule");
    return response.data;
  }, 
GetRoleById: async (roleId: string) => {
    const res = await apiClient.get(`/RoleMaster/GetRoleById?roleId=${roleId}`);
    return res.data;
  },

  SaveRole: async (payload: any) => {
    return apiClient.post("/RoleMaster/SaveRole", payload);
  },

  UpdateRole: async (payload: any) => {
    return apiClient.post("/RoleMaster/UpdateRole", payload);
  },

DeleteRole: async (roleId: string) => {
  return apiClient.delete(`/RoleMaster/DeleteRole?roleId=${roleId}`);
},

  
};

 