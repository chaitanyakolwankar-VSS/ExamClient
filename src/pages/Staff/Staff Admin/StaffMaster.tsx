import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FileSpreadsheet, ListTree, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import { Modal } from "../../../components/ui/modal";
import SheetImportPanel from "../Students Admin/SheetImportPanel";
import StaffOptionLists from "./StaffOptionLists";
import { STAFF_TITLES, StaffService } from "../../../services/StaffService";
import type { Staff, StaffOption, StaffSave } from "../../../services/StaffService";

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

const tabClass = (active: boolean) =>
  `flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden focus-visible:ring-inset ${
    active ? "bg-brand-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
  }`;

// Names: letters, spaces, dot, apostrophe and hyphen (D'Souza, K. Patil, Rao-Shah).
const NAME = /^[A-Za-z .'-]*$/;

const EMPTY: StaffSave = {
  employeeCode: "",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  departmentId: null,
  designationId: null,
  isExternal: false,
  externalCollege: "",
  externalCity: "",
  isActive: true,
};

const TYPE_OPTIONS = [
  { value: "", label: "Our staff and external" },
  { value: "internal", label: "Our staff" },
  { value: "external", label: "External" },
];

const toForm = (s: Staff): StaffSave => ({
  employeeCode: s.employeeCode ?? "",
  title: s.title,
  firstName: s.firstName,
  middleName: s.middleName ?? "",
  lastName: s.lastName,
  email: s.email,
  departmentId: s.departmentId,
  designationId: s.designationId,
  isExternal: s.isExternal,
  externalCollege: s.externalCollege ?? "",
  externalCity: s.externalCity ?? "",
  isActive: s.isActive,
});

/** Staff Master: the people who get exam letters (supervision duty, examiner / moderator appointment). */
export default function StaffMaster() {
  const [tab, setTab] = useState<"staff" | "excel" | "lists">("staff");
  const [options, setOptions] = useState<StaffOption[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [type, setType] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [editing, setEditing] = useState<{ id: string | null; form: StaffSave } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const departments = useMemo(() => options.filter((o) => o.kind === "Department").map((o) => ({ value: o.id, label: o.name })), [options]);
  const designations = useMemo(() => options.filter((o) => o.kind === "Designation").map((o) => ({ value: o.id, label: o.name })), [options]);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await StaffService.options());
    } catch {
      setOptions([]);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      setStaff(await StaffService.list({ search, departmentId: departmentId || undefined, designationId: designationId || undefined, type, includeInactive }));
    } catch (err) {
      Swal.fire("Staff", apiReason(err, "The staff list could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  }, [search, departmentId, designationId, type, includeInactive]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Search waits for typing to pause; the drop-downs reload at once.
  useEffect(() => {
    const timer = setTimeout(loadStaff, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadStaff, search]);

  const set = (patch: Partial<StaffSave>) => setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));

  const openAdd = () => {
    setFormError("");
    setEditing({ id: null, form: { ...EMPTY } });
  };

  const openEdit = (s: Staff) => {
    setFormError("");
    setEditing({ id: s.staffId, form: toForm(s) });
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    const missing = [
      !f.title && "title",
      !f.firstName.trim() && "first name",
      !f.email.trim() && "email",
      !f.isExternal && !f.employeeCode.trim() && "employee ID",
      f.isExternal && !f.externalCollege.trim() && "their college",
    ].filter(Boolean);
    if (missing.length > 0) {
      setFormError(`Fill in ${missing.join(", ")}.`);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await StaffService.save(editing.id, f);
      setEditing(null);
      await Promise.all([loadStaff(), loadOptions()]);
    } catch (err) {
      setFormError(apiReason(err, "The details could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Staff) => {
    const ok = await Swal.fire({
      title: `Delete ${s.name}?`,
      text: "Use this for a mistaken entry. For someone who has left, edit them and untick “Still at the college” instead, so their old letters stay.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d92d20",
    });
    if (!ok.isConfirmed) return;
    try {
      await StaffService.remove(s.staffId);
      await Promise.all([loadStaff(), loadOptions()]);
    } catch (err) {
      Swal.fire("Staff", apiReason(err, "Could not delete."), "error");
    }
  };

  const downloadSheet = async () => {
    try {
      const { blob, fileName } = await StaffService.downloadSheet();
      saveAs(blob, fileName);
    } catch {
      Swal.fire("Staff", "The sheet could not be downloaded.", "error");
    }
  };

  const columns = [
    { key: "employeeCode", label: "Employee ID", sortable: true, render: (s: Staff) => s.employeeCode ?? "—" },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (s: Staff) => (
        <span>
          {s.name}
          {!s.isActive && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-white/[0.05] dark:text-gray-400">Left</span>}
        </span>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "department", label: "Department", sortable: true, render: (s: Staff) => s.department ?? "" },
    { key: "designation", label: "Designation", sortable: true, render: (s: Staff) => s.designation ?? "" },
    {
      key: "isExternal",
      label: "Type",
      render: (s: Staff) =>
        s.isExternal ? (
          <span title={[s.externalCollege, s.externalCity].filter(Boolean).join(", ")}>
            External{s.externalCollege ? `, ${s.externalCollege}` : ""}
          </span>
        ) : (
          "Our staff"
        ),
    },
    {
      key: "actions",
      label: "",
      render: (s: Staff) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => openEdit(s)} title="Edit" aria-label={`Edit ${s.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]">
            <Pencil className="size-4" />
          </button>
          <button type="button" onClick={() => remove(s)} title="Delete" aria-label={`Delete ${s.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/[0.05]">
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const f = editing?.form;

  return (
    <>
      <PageMeta title="GradeSphere | Staff Master" description="Staff who receive exam letters" />
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Staff Master</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">The people who get exam letters: supervision duties and examiner / moderator appointments.</p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <button type="button" className={tabClass(tab === "staff")} onClick={() => setTab("staff")}>
              <Users className="size-4" /> Staff
            </button>
            <button type="button" className={`${tabClass(tab === "excel")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("excel")}>
              <FileSpreadsheet className="size-4" /> Excel import
            </button>
            <button type="button" className={`${tabClass(tab === "lists")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("lists")}>
              <ListTree className="size-4" /> Departments &amp; designations
            </button>
          </div>
        </div>

        {tab === "staff" && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 lg:flex-row lg:items-center dark:border-gray-800">
              <div className="relative lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email or employee ID"
                  aria-label="Search staff"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                />
              </div>
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
                <Select options={[{ value: "", label: "All designations" }, ...designations]} placeholder="All designations" value={designationId} onChange={setDesignationId} />
                <Select options={TYPE_OPTIONS} placeholder="Our staff and external" value={type} onChange={setType} />
              </div>
              <Checkbox label="Show people who left" checked={includeInactive} onChange={setIncludeInactive} />
              <Button size="sm" onClick={openAdd} startIcon={<UserPlus className="size-4" />}>
                Add staff
              </Button>
            </div>
            <div className="p-4 sm:p-5">
              {loading && staff.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
              ) : staff.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No staff {search || departmentId || designationId || type ? "match these filters" : "yet. Add them one at a time, or all at once with Excel import"}.
                </p>
              ) : (
                <DataTable data={staff} columns={columns} pageSizeOptions={[25, 50, 100]} stickyHeader />
              )}
            </div>
          </div>
        )}

        {tab === "excel" && (
          <div className="@container rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SheetImportPanel
              steps={[
                { title: "Download the staff sheet", text: "It already lists everyone saved, so the same sheet adds new staff and updates existing ones." },
                {
                  title: "Fill it in",
                  text: (
                    <>
                      Employee ID, title, name and email for each person. Department and designation are drop-downs; type a new one and it is added to the list.
                      For a professor of another college, choose External = Yes and fill in their college.
                    </>
                  ),
                },
                { title: "Upload it", text: "Each row is checked first (new, changes or unchanged). Nothing is saved until you press Save." },
              ]}
              downloadLabel="Download staff sheet"
              onDownload={downloadSheet}
              upload={async (file, preview) => {
                const result = await StaffService.importSheet(file, preview);
                if (result.saved) {
                  loadStaff();
                  loadOptions();
                }
                return result;
              }}
              saveLabel="Save staff"
              ready={() => true}
              reason={apiReason}
            />
          </div>
        )}

        {tab === "lists" && <StaffOptionLists options={options} onChanged={loadOptions} reason={apiReason} />}
      </div>

      <Modal isOpen={!!editing} onClose={() => !saving && setEditing(null)} className="m-4 max-w-[760px]">
        {f && (
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editing?.id ? "Edit staff" : "Add staff"}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The name is printed on their letters exactly as entered here.</p>

            <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-4">
              <Select label="Title *" placeholder="Title" options={STAFF_TITLES.map((t) => ({ value: t, label: t }))} value={f.title} onChange={(v) => set({ title: v })} />
              <Input label="First name *" value={f.firstName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ firstName: e.target.value })} />
              <Input label="Middle name" value={f.middleName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ middleName: e.target.value })} />
              <Input label="Last name" value={f.lastName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ lastName: e.target.value })} />

              <div className="sm:col-span-2">
                <Input label="Email *" type="email" value={f.email} maxLength={256} onChange={(e) => set({ email: e.target.value })} hint="Their own address: letters are sent here." />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={f.isExternal ? "Employee ID" : "Employee ID *"}
                  value={f.employeeCode}
                  maxLength={30}
                  onChange={(e) => /^[A-Za-z0-9/-]*$/.test(e.target.value) && set({ employeeCode: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="sm:col-span-2">
                <Select label="Department" placeholder="Choose department" options={[{ value: "", label: "None" }, ...departments]} value={f.departmentId ?? ""} onChange={(v) => set({ departmentId: v || null })} />
              </div>
              <div className="sm:col-span-2">
                <Select label="Designation" placeholder="Choose designation" options={[{ value: "", label: "None" }, ...designations]} value={f.designationId ?? ""} onChange={(v) => set({ designationId: v || null })} />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-4">
                <Checkbox label="External (professor of another college)" checked={f.isExternal} onChange={(v) => set({ isExternal: v })} />
                {editing?.id && <Checkbox label="Still at the college" checked={f.isActive} onChange={(v) => set({ isActive: v })} />}
              </div>

              {f.isExternal && (
                <>
                  <div className="sm:col-span-3">
                    <Input label="Their college *" value={f.externalCollege} maxLength={200} onChange={(e) => set({ externalCollege: e.target.value })} />
                  </div>
                  <Input label="City" value={f.externalCity} maxLength={100} onChange={(e) => set({ externalCity: e.target.value })} />
                </>
              )}
            </div>

            {formError && (
              <p role="alert" className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
