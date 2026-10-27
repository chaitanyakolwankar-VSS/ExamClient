import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FileSpreadsheet, ListTree, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import SheetImportPanel from "../Students Admin/SheetImportPanel";
import StaffOptionLists from "./StaffOptionLists";
import { ModalShell, StaffForm, controlClass, focusRing } from "./StaffParts";
import { StaffService } from "../../../services/StaffService";
import type { Staff, StaffOption, StaffSave } from "../../../services/StaffService";

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

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

/** People shown first; "Show more" adds another page. */
const PAGE = 50;

const tagClass = "inline-block rounded-md px-1.5 py-0.5 text-xs font-medium";

const rowButton = `rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05] ${focusRing}`;

/** Staff Master: the people who get exam letters (supervision duty, examiner / moderator appointment). */
export default function StaffMaster() {
  const [options, setOptions] = useState<StaffOption[]>([]);
  const [all, setAll] = useState<Staff[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showLeft, setShowLeft] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const [editing, setEditing] = useState<{ id: string | null; form: StaffSave } | null>(null);
  const [importing, setImporting] = useState(false);
  const [managingLists, setManagingLists] = useState(false);

  const departments = useMemo(() => options.filter((o) => o.kind === "Department").map((o) => ({ value: o.id, label: o.name })), [options]);
  const designations = useMemo(() => options.filter((o) => o.kind === "Designation").map((o) => ({ value: o.id, label: o.name })), [options]);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await StaffService.options());
    } catch {
      setOptions([]);
    }
  }, []);

  // The whole list is loaded once (people who left included); search and the "left" box work in the browser.
  const loadStaff = useCallback(async () => {
    try {
      setAll(await StaffService.list({ includeInactive: true }));
    } catch (err) {
      Swal.fire("Staff", apiReason(err, "The staff list could not be loaded."), "error");
    } finally {
      setLoaded(true);
    }
  }, []);

  const refresh = useCallback(() => Promise.all([loadStaff(), loadOptions()]).then(() => undefined), [loadStaff, loadOptions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setLimit(PAGE);
  }, [search, showLeft]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((s) => showLeft || s.isActive)
      .filter(
        (s) =>
          !q ||
          [s.name, s.email, s.employeeCode, s.department, s.designation, s.externalCollege].some((v) => (v ?? "").toLowerCase().includes(q)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, search, showLeft]);

  const openAdd = () => setEditing({ id: null, form: { ...EMPTY } });
  const openEdit = (s: Staff) => setEditing({ id: s.staffId, form: toForm(s) });

  const save = async (form: StaffSave): Promise<string | null> => {
    if (!editing) return null;
    try {
      await StaffService.save(editing.id, form);
      setEditing(null);
      await refresh();
      return null;
    } catch (err) {
      return apiReason(err, "The details could not be saved.");
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
      await refresh();
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

  const openImport = () => setImporting(true);
  const noOneSaved = loaded && all.length === 0;
  const shown = visible.slice(0, limit);

  const emptyText = search.trim()
    ? `No one matches “${search.trim()}”.`
    : all.length > 0
      ? "Everyone saved has left. Tick “Show people who left” to see them."
      : "";

  return (
    <>
      <PageMeta title="GradeSphere | Staff Master" description="Staff who receive exam letters" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Staff Master</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The people who get exam letters.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openImport} startIcon={<FileSpreadsheet className="size-4" />} className={focusRing}>
              Import from Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setManagingLists(true)} startIcon={<ListTree className="size-4" />} className={focusRing}>
              Departments &amp; designations
            </Button>
            <Button size="sm" onClick={openAdd} startIcon={<UserPlus className="size-4" />} className={focusRing}>
              Add staff
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {noOneSaved ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
                <Users className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-medium text-gray-800 dark:text-white/90">No staff yet</p>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">Add people one at a time, or bring in everyone at once from an Excel sheet.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={openAdd} startIcon={<UserPlus className="size-4" />} className={focusRing}>
                  Add staff
                </Button>
                <Button variant="outline" size="sm" onClick={openImport} startIcon={<FileSpreadsheet className="size-4" />} className={focusRing}>
                  Import from Excel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
                <div className="relative w-full sm:max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, ID, department…"
                    aria-label="Search staff"
                    className={`${controlClass} pl-10`}
                  />
                </div>
                <Checkbox
                  label="Show people who left"
                  checked={showLeft}
                  onChange={setShowLeft}
                  className="focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden"
                />
              </div>

              {!loaded ? (
                <p role="status" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading…
                </p>
              ) : visible.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th scope="col" className="px-4 py-3 font-medium sm:pl-6">Name</th>
                          <th scope="col" className="px-4 py-3 font-medium">Employee ID</th>
                          <th scope="col" className="px-4 py-3 font-medium">Department</th>
                          <th scope="col" className="px-4 py-3 font-medium">Designation</th>
                          <th scope="col" className="px-4 py-3 sm:pr-6">
                            <span className="sr-only">Edit or delete</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {shown.map((s) => (
                          <tr key={s.staffId} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3 sm:pl-6">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className={`font-medium ${s.isActive ? "text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"}`}>{s.name}</span>
                                {s.isExternal && (
                                  <span
                                    className={`${tagClass} bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300`}
                                    title={[s.externalCollege, s.externalCity].filter(Boolean).join(", ") || "External professor"}
                                  >
                                    External
                                  </span>
                                )}
                                {!s.isActive && <span className={`${tagClass} bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400`}>Left</span>}
                              </div>
                              <div className="mt-0.5 break-all text-xs text-gray-500 dark:text-gray-400">{s.email}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.employeeCode || "—"}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.department || "—"}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.designation || "—"}</td>
                            <td className="px-4 py-3 sm:pr-6">
                              <div className="flex justify-end gap-1">
                                <button type="button" onClick={() => openEdit(s)} title="Edit" aria-label={`Edit ${s.name}`} className={`${rowButton} hover:text-brand-500`}>
                                  <Pencil className="size-4" />
                                </button>
                                <button type="button" onClick={() => remove(s)} title="Delete" aria-label={`Delete ${s.name}`} className={`${rowButton} hover:text-error-500`}>
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-6 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {visible.length > shown.length ? `Showing ${shown.length} of ${visible.length} people` : `${visible.length} ${visible.length === 1 ? "person" : "people"}`}
                    </p>
                    {visible.length > shown.length && (
                      <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + PAGE)} className={focusRing}>
                        Show more
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} showCloseButton={false} className="m-4 max-w-[720px]">
        {editing && (
          <ModalShell title={editing.id ? "Edit staff" : "Add staff"} description="The name is printed on their letters exactly as entered here." onClose={() => setEditing(null)}>
            <StaffForm initial={editing.form} isEdit={!!editing.id} departments={departments} designations={designations} onSave={save} onCancel={() => setEditing(null)} />
          </ModalShell>
        )}
      </Modal>

      <Modal isOpen={importing} onClose={() => setImporting(false)} showCloseButton={false} className="m-4 max-w-[980px]">
        <ModalShell title="Import from Excel" description="Add or update many people at once. The file is checked first; nothing is saved until you press Save." onClose={() => setImporting(false)}>
          <div className="@container rounded-2xl border border-gray-200 dark:border-gray-800">
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
                if (result.saved) refresh();
                return result;
              }}
              saveLabel="Save staff"
              ready={() => true}
              reason={apiReason}
            />
          </div>
        </ModalShell>
      </Modal>

      <Modal isOpen={managingLists} onClose={() => setManagingLists(false)} showCloseButton={false} className="m-4 max-w-[820px]">
        <ModalShell
          title="Departments & designations"
          description="These fill the drop-downs when you add staff. Names can be changed; one in use cannot be deleted. The staff sheet also adds new ones."
          onClose={() => setManagingLists(false)}
        >
          <StaffOptionLists options={options} onChanged={refresh} reason={apiReason} />
        </ModalShell>
      </Modal>
    </>
  );
}
