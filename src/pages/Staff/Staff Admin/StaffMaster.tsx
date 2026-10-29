import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FileSpreadsheet, ListTree, Pencil, Search, Trash2, User, UserPlus } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import { Modal } from "../../../components/ui/modal";
import SheetImportPanel from "../Students Admin/SheetImportPanel";
import StaffOptionLists from "./StaffOptionLists";
import StaffDetailsFields from "./StaffDetailsFields";
import { checkStaff, emptyStaff } from "./staffFields";
import { StaffService } from "../../../services/StaffService";
import type { Staff, StaffOption, StaffSave } from "../../../services/StaffService";

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

/** Segmented-toggle button: the page tabs (py-2) and the "Single / Excel import" switch (py-2.5). */
const tabClass = (active: boolean, tall = false) =>
  `flex items-center justify-center gap-2 px-4 ${tall ? "py-2.5" : "py-2"} text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden focus-visible:ring-inset ${
    active ? "bg-brand-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
  }`;

const toForm = (s: Staff): StaffSave => ({
  employeeCode: s.employeeCode ?? "",
  title: s.title,
  firstName: s.firstName,
  middleName: s.middleName ?? "",
  lastName: s.lastName,
  email: s.email,
  departmentId: s.departmentId,
  designationId: s.designationId,
  isTeaching: s.isTeaching,
  isExternal: s.isExternal,
  externalCollege: s.externalCollege ?? "",
  externalCity: s.externalCity ?? "",
  isActive: s.isActive,
});

/** Staff Master: the people who get exam letters (supervision duty, examiner / moderator appointment). */
export default function StaffMaster() {
  const [tab, setTab] = useState<"add" | "find" | "lists">("add");
  const [mode, setMode] = useState<"single" | "excel">("single");
  const [options, setOptions] = useState<StaffOption[]>([]);

  const departments = useMemo(() => options.filter((o) => o.kind === "Department").map((o) => ({ value: o.id, label: o.name })), [options]);
  const designations = useMemo(() => options.filter((o) => o.kind === "Designation").map((o) => ({ value: o.id, label: o.name })), [options]);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await StaffService.options());
    } catch {
      setOptions([]);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // ---- One member of staff ----
  const [fields, setFields] = useState<StaffSave>(emptyStaff);
  const [saving, setSaving] = useState(false);

  const saveStaff = async () => {
    const problem = checkStaff(fields);
    if (problem) {
      Swal.fire("Staff details", problem, "warning");
      return;
    }
    setSaving(true);
    try {
      const saved = await StaffService.save(null, fields);
      setFields(emptyStaff());
      loadOptions();
      Swal.fire({ icon: "success", title: "Staff saved", text: saved?.name, timer: 2500 });
    } catch (err) {
      Swal.fire("Not saved", apiReason(err, "The details could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- Excel import ----
  const downloadSheet = async () => {
    try {
      const { blob, fileName } = await StaffService.downloadSheet();
      saveAs(blob, fileName);
    } catch {
      Swal.fire("Download failed", "The sheet could not be downloaded.", "error");
    }
  };

  // ---- Find staff ----
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [teaching, setTeaching] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      setStaff(
        await StaffService.list({
          search,
          departmentId: departmentId || undefined,
          designationId: designationId || undefined,
          teaching: teaching || undefined,
          includeInactive,
        }),
      );
    } catch (err) {
      Swal.fire("Find staff", apiReason(err, "The staff list could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  }, [search, departmentId, designationId, teaching, includeInactive]);

  // The list loads when "Find staff" is open; search waits for typing to pause, the drop-downs reload at once.
  useEffect(() => {
    if (tab !== "find") return;
    const timer = setTimeout(loadStaff, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tab, loadStaff, search]);

  const remove = async (s: Staff) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: `Delete ${s.name}?`,
      text: "Use this for a mistaken entry. For someone who has left, edit them and untick “Still at the college” instead, so their old letters stay.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d92d20",
    });
    if (!ok.isConfirmed) return;
    try {
      await StaffService.remove(s.staffId);
      setStaff((list) => list.filter((r) => r.staffId !== s.staffId));
      loadOptions();
    } catch (err) {
      Swal.fire("Not deleted", apiReason(err, "The staff could not be deleted."), "error");
    }
  };

  // ---- Edit dialog ----
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editFields, setEditFields] = useState<StaffSave>(emptyStaff);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (s: Staff) => {
    setEditFields(toForm(s));
    setEditing(s);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const problem = checkStaff(editFields);
    if (problem) {
      Swal.fire("Staff details", problem, "warning");
      return;
    }
    setEditSaving(true);
    try {
      await StaffService.save(editing.staffId, editFields);
      setEditing(null);
      await Promise.all([loadStaff(), loadOptions()]);
      Swal.fire({ icon: "success", title: "Staff updated", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not saved", apiReason(err, "The changes could not be saved."), "error");
    } finally {
      setEditSaving(false);
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
          {!s.isTeaching && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-white/[0.05] dark:text-gray-400">Non-teaching</span>}
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
          <button
            type="button"
            onClick={() => openEdit(s)}
            title="Edit staff"
            aria-label={`Edit ${s.name}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => remove(s)}
            title="Delete staff"
            aria-label={`Delete ${s.name}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/[0.05]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = !!(search || departmentId || designationId || teaching);

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
            <button type="button" className={tabClass(tab === "add")} onClick={() => setTab("add")}>
              <UserPlus className="size-4" /> Add staff
            </button>
            <button type="button" className={`${tabClass(tab === "find")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("find")}>
              <Search className="size-4" /> Find staff
            </button>
            <button type="button" className={`${tabClass(tab === "lists")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("lists")}>
              <ListTree className="size-4" /> Departments &amp; designations
            </button>
          </div>
        </div>

        {tab === "add" && (
          <div className="@container rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Toolbar: how staff are added (one at a time, or from a sheet). */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:justify-between @min-[860px]:gap-4 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add staff</span>
              <div role="group" aria-label="How to add staff" className="grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-gray-300 @min-[860px]:flex dark:border-gray-700">
                <button type="button" aria-pressed={mode === "single"} className={tabClass(mode === "single", true)} onClick={() => setMode("single")}>
                  <User className="size-4" aria-hidden="true" /> Single
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "excel"}
                  className={`${tabClass(mode === "excel", true)} border-l border-gray-300 dark:border-gray-700`}
                  onClick={() => setMode("excel")}
                >
                  <FileSpreadsheet className="size-4" aria-hidden="true" /> Excel import
                </button>
              </div>
            </div>

            {mode === "single" ? (
              <div className="flex flex-col gap-6 p-4 sm:p-5">
                <StaffDetailsFields value={fields} onChange={setFields} departments={departments} designations={designations} />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" onClick={() => setFields(emptyStaff())} disabled={saving}>
                    Clear
                  </Button>
                  <Button onClick={saveStaff} disabled={saving}>
                    {saving ? "Saving…" : "Save staff"}
                  </Button>
                </div>
              </div>
            ) : (
              <SheetImportPanel
                steps={[
                  { title: "Download the staff sheet", text: "It already lists everyone saved, so the same sheet adds new staff and updates existing ones." },
                  {
                    title: "Fill it in",
                    text: (
                      <>
                        Employee ID, title, name and email for each person. The Teaching column is Yes or No (blank means Yes). Department and designation are drop-downs; type a new one and it is added to the list.
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
                  if (result.saved) loadOptions();
                  return result;
                }}
                saveLabel="Save staff"
                ready={() => true}
                reason={apiReason}
              />
            )}
          </div>
        )}

        {tab === "find" && (
          <ComponentCard title="Find staff" desc="Search by name, email or employee ID, or narrow the list by department, designation or staff type.">
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3 xl:grid-cols-5">
              <div className="relative">
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
              <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
              <Select options={[{ value: "", label: "All designations" }, ...designations]} placeholder="All designations" value={designationId} onChange={setDesignationId} />
              <Select
                options={[
                  { value: "", label: "All types" },
                  { value: "teaching", label: "Teaching" },
                  { value: "non-teaching", label: "Non-teaching" },
                ]}
                placeholder="All types"
                value={teaching}
                onChange={setTeaching}
              />
              <Checkbox label="Show people who left" checked={includeInactive} onChange={setIncludeInactive} />
            </div>

            {staff.length > 0 ? (
              <DataTable data={staff} columns={columns} pageSizeOptions={[10, 20, 50, 100]} />
            ) : loading ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
            ) : (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {filtered ? "No staff match these filters." : "No staff yet. Add them one at a time, or all at once with Excel import."}
              </p>
            )}
          </ComponentCard>
        )}

        {tab === "lists" && <StaffOptionLists options={options} onChanged={loadOptions} reason={apiReason} />}
      </div>

      <Modal isOpen={!!editing} onClose={() => !editSaving && setEditing(null)} className="max-w-[960px] p-6">
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="pr-10">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit staff</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">The name is printed on their letters exactly as entered here.</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col gap-6 p-4 sm:p-5">
                <StaffDetailsFields value={editFields} onChange={setEditFields} departments={departments} designations={designations} showActive />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditing(null)} disabled={editSaving}>
                    Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
