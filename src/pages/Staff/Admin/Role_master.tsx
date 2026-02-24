
import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../../components/ui/table/index";
import { RoleMasterService } from "../../../services/Role_masterService";
import { Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";
import DataTable from "../../../components/ui/table/DataTable";

interface RoleMasterDto {
  roleId: string;
  name: string;
  description: string;
  permissionFormNames: string;
  permissionForms: string;
}

export default function RoleMaster() {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [rolesList, setRolesList] = useState<RoleMasterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [permissionList, setPermissionList] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [alert, setAlert] = useState<{
    variant: "warning";
    title: string;
    message: string;
  } | null>(null);
  const filters = useMemo(() => ({}), []);


  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);


  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await RoleMasterService.GetRoles();
      setRolesList(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionList = async () => {
    const data = await RoleMasterService.GetPermissions();
    setPermissionList(data ?? []);
    return data ?? [];
  };

  const handleRefresh = () => {
    setRole("");
    setDescription("");
    setShowForm(false);
    setIsEditing(false);
    setEditingRoleId(null);
    setSelectedPermissions([]);
    fetchRoles();
  };

  const groupedPermissions = permissionList.reduce((acc: any, item: any) => {
    if (!acc[item.permissionModuleName]) acc[item.permissionModuleName] = [];
    acc[item.permissionModuleName].push(item);
    return acc;
  }, {});

  const handleCheckAll = (checked: boolean) => {
    if (checked) { 
      const allIds = permissionList.map(p =>
        p.permissionId.toLowerCase()
      );
      setSelectedPermissions(allIds);
    } else { 
      setSelectedPermissions([]);
    }
  };


  const handleSave = async () => {
    if (selectedPermissions.length === 0) {
      setAlert({
        variant: "warning",
        title: "Permission Required",
        message: "Select at least one Form",
      });
      return;
    }

    try {
      if (isEditing && editingRoleId) {
        await RoleMasterService.UpdateRole({
          roleId: editingRoleId,
          name: role,
          description,
          permissionIds: selectedPermissions,
        });

        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Updated Successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await RoleMasterService.SaveRole({
          name: role,
          description,
          permissionIds: selectedPermissions,
        });

        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Role Saved Successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      handleRefresh();
    } catch (err) { 
    }
  };
  const handleDelete = async (roleId: string) => { 
    const result = await Swal.fire({
      title: "Delete Data?",
      text: "Are you sure you want to delete this data?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#338bddff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await RoleMasterService.DeleteRole(roleId); 
        Swal.fire("Deleted!", "Role has been deleted.", "success");  
        fetchRoles(); 
      } catch (err) { 
        Swal.fire("Error!", "Failed to delete role.", "error");  
      }
    }
  };


  const handleEdit = async (r: RoleMasterDto) => {
    setShowForm(true);
    setIsEditing(true);
    setEditingRoleId(r.roleId);
    setRole(r.name);
    setDescription(r.description);

    await fetchPermissionList();
    const res = await RoleMasterService.GetRoleById(r.roleId);
    setSelectedPermissions((res.permissionIds ?? []).map((id: string) => id.toLowerCase()));
  };

  const handlePermissionToggle = (permissionId: string) => {
    const id = permissionId.toLowerCase();
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const roleColumns = [
    { key: "name", label: "Role Name", sortable: true, className: "w-64", },
    {
      key: "description",
      label: "Description",
      className: "w-64",  
    },
    {
      key: "permissionFormNames",
      label: "Permissions",
      render: (row: RoleMasterDto) => (
        <div className="overflow-x-auto">{row.permissionFormNames}</div>
      ),
    },
    {
      key: "edit",
      label: "Edit",
      sortable: false,
      render: (row: RoleMasterDto) => (
        <button onClick={() => handleEdit(row)}>
          <Pencil className="text-blue-500" />
        </button>
      ),
    },
    {
      key: "delete",
      label: "Delete",
      sortable: false,
      render: (row: RoleMasterDto) => (
        <button onClick={() => handleDelete(row.roleId)}>
          <Trash2 className="text-red-500" />
        </button>
      ),
    },
  ];
 
  return (
    <div className="grid w-full grid-cols-1 gap-6">
      <ComponentCard title="Role Master">
        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        )}

        {!showForm && (
          <Button
            onClick={() => {
              setShowForm(true);
              fetchPermissionList();
            }}
          >
            Add Role
          </Button>
        )}
 
        {showForm && (
          <div className="space-y-6">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4">
                <Input
                  label="Role Name"
                  value={role}
                  onChange={(e) =>
                    /^[A-Za-z ]*$/.test(e.target.value) &&
                    e.target.value.length <= 12 &&
                    setRole(e.target.value)
                  }
                />
              </div>
              <div className="col-span-4">
                <Input
                  label="Description"
                  value={description}
                  onChange={(e) =>
                    /^[A-Za-z ]*$/.test(e.target.value) &&
                    e.target.value.length <= 30 &&
                    setDescription(e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <Button
                  size="md"
                  variant="primary"
                  disabled={!role.trim()}
                  onClick={handleSave}
                  className="w-full"
                >
                  {isEditing ? "Update" : "Save"}
                </Button>
              </div>

              <div className="col-span-2">
                <Button size="md" variant="primary" onClick={handleRefresh} className="w-full">
                  Refresh
                </Button>
              </div>
            </div>
 
            <div>
              <Table className="mt-4 border border-black-600">
                <TableHeader>
                  <TableRow className="bg-gray-100 text-black">
                    <TableCell isHeader className="border border-black-600 py-3 text-center">
                      Module Name
                    </TableCell>
                    <TableCell isHeader className="border border-black-600 text-center">
                      Form Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="border border-black-600 px-2 py-2"
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center">
                        <span className="text-center">
                          Access / Check All
                        </span>

                        <Switch
                          key={selectedPermissions.length}  
                          label=""
                          color="blue"
                          defaultChecked={
                            permissionList.length > 0 &&
                            selectedPermissions.length === permissionList.length
                          }
                          onChange={(checked) => handleCheckAll(checked)}
                        />
                      </div>
                    </TableCell>


                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Object.entries(groupedPermissions).map(([PermissionModuleName, forms]: any) =>
                    forms.map((f: any, index: number) => (
                      <tr key={f.permissionId}> 
                        {index === 0 && (
                          <td rowSpan={forms.length} className="border px-4 py-2 font-semibold align-middle">
                            {PermissionModuleName}
                          </td>
                        )}
 
                        <td className="border px-4 py-2">{f.permissionFormName}</td>
 
                        <td className="border">
                          <div className="flex justify-center items-center">
                            <Switch
                              key={selectedPermissions.join(",")}    
                              label=""
                              color="blue"
                              defaultChecked={selectedPermissions.includes(
                                f.permissionId.toLowerCase()
                              )}
                              onChange={() => handlePermissionToggle(f.permissionId)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
 
        {!showForm && !loading && rolesList.length > 0 && (
          <DataTable
            data={rolesList}
            columns={roleColumns}
            searchKeys={["name", "description", "permissionFormNames"]}
            filters={filters}
            pageSizeOptions={[5, 10, 20, 50]}
          />

        )}
      </ComponentCard>
    </div>
  );
}
