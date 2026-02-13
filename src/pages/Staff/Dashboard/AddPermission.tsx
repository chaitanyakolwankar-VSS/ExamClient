import { useState,useEffect } from "react";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Form from "../../../components/form/Form";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import { permissionService } from "../../../services/permissionService";
import type { PermissionGroup } from "../../../services/permissionService";
import { Pencil,Trash2,RotateCcw  } from "lucide-react";
import Alert from "../../../components/ui/alert/Alert";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";
// import GenericTable,{Column} from "../../../components/ui/table/GenericTable";

const AddPermission = () => {
  const [module, setModule] = useState("");
  const [permissionName, setPermissionName] = useState("");
  const [loading, setLoading] = useState(false);
const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
const [editingId, setEditingId] = useState<string | null>(null);
const [isEditMode, setIsEditMode] = useState(false);
const [alert, setAlert] = useState<{
  variant: "success" | "error" | "info";
  title: string;
  message: string;
} | null>(null);



  const moduleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Academic Master", label: "Academic Master" },
    { value: "Students Admin", label: "Students Admin" },
    { value: "Conduct Exam", label: "Conduct Exam" },
    { value: "Marks Entry", label: "Marks Entry" },
    { value: "Reports", label: "Reports" },
  ];

const handleEdit = (group: PermissionGroup, form: any) => {
  const moduleExists = moduleOptions.some(
    (opt) => opt.value === group.permissionModuleName
  );

  setModule(moduleExists ? group.permissionModuleName : ""); 
  setPermissionName(form.permissionFormName);
  setEditingId(form.permissionId);
  setIsEditMode(true);
};

const resetForm = () => {
  setModule("");
  setPermissionName("");
  setEditingId(null);
  setIsEditMode(false);
};

useEffect(() => {
  if (alert) {
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }
}, [alert]);



const handleDelete = async (id: string) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'You won’t be able to revert this!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  });

  if (result.isConfirmed) {
    await permissionService.deletePermission(id);
    await loadPermissions();

    Swal.fire('Deleted!', 'Your permission has been deleted.', 'success');
  }
};

const handleSubmit = async () => {
  if (!module || !permissionName) return;

  setLoading(true);

  try {
    if (isEditMode && editingId) {
      await permissionService.updatePermission(editingId, permissionName);
      setAlert({
  variant: "info",
  title: "Permission Updated",
  message: "Permission Updated Successfully",
});

    } else {
      await permissionService.createPermission({
        permissionModuleName: module,
        permissionFormName: permissionName,
      });
      // alert("Permission added");
      setAlert({
  variant: "success",
  title: "Permission Added",
  message: "Permission Added Successfully",
});

    }

    setModule("");
    setPermissionName("");
    setEditingId(null);
    setIsEditMode(false);

    await loadPermissions();
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadPermissions();
}, []);

const loadPermissions = async () => {
  const data = await permissionService.getGroupedPermissions();
  setPermissionGroups(data);
};

const filteredPermissionGroups = module
  ? permissionGroups.filter(
      (g) => g.permissionModuleName === module
    )
  : permissionGroups;


  type FlatPermissionRow = {
  permissionId: string;
  module: string;
  form: string;
  rowSpan: number;
  isFirst: boolean;
  group: PermissionGroup;
  formObj: any;
};


const flatData: FlatPermissionRow[] = filteredPermissionGroups.flatMap(group =>
  group.permissionForms.map((form, index) => ({
    permissionId: form.permissionId,
    module: group.permissionModuleName,
    form: form.permissionFormName,
    rowSpan: group.permissionForms.length,
    isFirst: index === 0,
    group,
    formObj: form
  }))
);



const tableColumns = [
  {
    key: "module",
    label: "Module",
    className: "w-1/4 min-w-[200px]",
    sortable: true,
    render: (row: FlatPermissionRow) => ({
      content: row.isFirst ? row.module : undefined,
      rowSpan: row.isFirst ? row.rowSpan : undefined,
      skip: !row.isFirst
    })
  },
  {
    key: "form",
    label: "Form",
    sortable: false,
    className: "w-1/2 min-w-[300px]",
  },
  {
    key: "edit",
    label: "Edit",
    className: "w-[120px] text-center",
    render: (row: FlatPermissionRow) => ({
      content: (
        <button
          className="text-blue-600"
          onClick={() => handleEdit(row.group, row.formObj)}
        >
          <Pencil size={20}/>
        </button>
      )
    })
  },
  {
    key: "delete",
    label: "Delete",
    className: "w-[120px] text-center",
    render: (row: FlatPermissionRow) => ({
      content: (
        <button
          className="text-red-600"
          onClick={() => handleDelete(row.permissionId)}
        >
          <Trash2 size={20}/>
        </button>
      )
    })
  }
];




// const tableColumns = [
//   {
//     key: "module",
//     label: "Module",
//     className: "w-1/4 min-w-[200px]",
//     render: (row: FlatPermissionRow) => ({
//       content: row.isFirst ? row.module : undefined,
//       rowSpan: row.isFirst ? row.rowSpan : undefined,
//       skip: !row.isFirst
//     })
//   },
//   {
//     key: "form",
//     label: "Form",
//     className: "w-1/2 min-w-[300px]"
//   },
//   {
//     key: "edit",
//     label: "Edit",
//     className: "w-[120px] text-center",
//     // render: (row: FlatPermissionRow) => ({
//     //   content: (
//     //     <button className="text-blue-600">
//     //       <Pencil size={20}/>
//     //     </button>
//     //   )
//     // })
//     render: (row: FlatPermissionRow) => (
//   <button
//     className="text-blue-600"
//     onClick={() => handleEdit(row.group, row.formObj)}
//   >
//     <Pencil size={20}/>
//   </button>
// )
//   },
//   {
//     key: "delete",
//     label: "Delete",
//     className: "w-[120px] text-center",
//     // render: (row: FlatPermissionRow) => ({
//     //   content: (
//     //     <button className="text-red-600">
//     //       <Trash2 size={20}/>
//     //     </button>
//     //   )
//     // })
//     render: (row: FlatPermissionRow) => (
//   <button
//     className="text-red-600"
//     onClick={() => handleDelete(row.permissionId)}
//   >
//     <Trash2 size={20}/>
//   </button>
// )

//   }
// ];





  return (
    <ComponentCard title="Add Permission">
      {alert && (
  <div className="mb-4">
    <Alert
      variant={alert.variant}
      title={alert.title}
      message={alert.message}
    />
  </div>
)}

      <Form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
        
          <div className="w-full sm:w-1/4">
            <Select
  key={editingId ?? "new"}
  options={moduleOptions}
  placeholder="Select Module"
  defaultValue={module}
  onChange={setModule}
  disabled={isEditMode}
/>
          </div>

          <div className="w-full sm:w-1/4">
            <Input
              placeholder="Permission Form Name"
              label="Enter Form Name"
              value={permissionName}
              onChange={(e) => setPermissionName(e.target.value)}
            />
          </div>

<div className="w-full sm:w-1/4 flex items-end gap-3">
  <Button disabled={loading || !module}>
    {loading ? "Saving..." : isEditMode ? "Update" : "Add"}
  </Button>

  <button
    type="button"
    onClick={resetForm}
    className="h-11 w-11 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
    title="Reset"
  >
    <RotateCcw size={20} />
  </button>
</div>


        </div>
        <div className="w-full">
            <div className="mt-6 overflow-x-auto">

{/* <Table className="w-full border border-gray-200 rounded-lg">
  <TableHeader className="bg-gray-100">
    <TableRow>
      <TableCell isHeader className="border px-4 py-2 w-1/4">Module</TableCell>
      <TableCell isHeader className="border px-4 py-2 w-1/2">Form</TableCell>
      <TableCell isHeader className="border px-4 py-2 text-center w-1/8">Edit</TableCell>
      <TableCell isHeader className="border px-4 py-2 text-center w-1/8">Delete</TableCell>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filteredPermissionGroups.map((group) =>
      group.permissionForms.map((form, index) => (
        <TableRow key={form.permissionId} className="hover:bg-gray-50">

          {index === 0 && (
            <TableCell
              rowSpan={group.permissionForms.length}
              className="border px-4 py-2 font-semibold align-middle"
            >
              {group.permissionModuleName}
            </TableCell>
          )}

          <TableCell className="border px-4 py-2">
            {form.permissionFormName}
          </TableCell>

          <TableCell className="border px-4 py-2 text-center">
            <button className="text-blue-600" onClick={() => handleEdit(group, form)}>
              <Pencil size={24}/>
            </button>
          </TableCell>

          <TableCell className="border px-4 py-2 text-center">
            <button className="text-red-600 hover:underline" onClick={() => handleDelete(form.permissionId)}>
              <Trash2 size={24} />
            </button>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table> */}


<DataTable
  data={flatData}
  columns={tableColumns}
  searchKeys={["module", "form"]} 
  filters={{ module }}
  pageSizeOptions={[5, 10, 20]}
/>


</div>
        </div>
      </Form>
    </ComponentCard>
  );
};

export default AddPermission;
