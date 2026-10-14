import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Swal from "sweetalert2";
import { Plus } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { platformErrorMessage, platformService } from "../../services/platformService";
import type { AdminInput, PlatformCollegeDetail } from "../../services/platformService";
import AdminFields from "./AdminFields";
import { MAX_ADMINS, emptyAdmin, validateAdmin } from "./platformHelpers";

const HEAD = "px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const CELL = "px-3 py-2 text-sm text-gray-700 dark:text-gray-300";

type Notice = { variant: "success" | "error"; message: string };

export default function CollegeDetail() {
  const { id } = useParams<{ id: string }>();
  const [college, setCollege] = useState<PlatformCollegeDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const [branch, setBranch] = useState({ name: "", code: "" });
  const [year, setYear] = useState({ full: "", short: "", current: false });
  const [adminForm, setAdminForm] = useState<AdminInput | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setCollege(await platformService.getCollege(id));
      setLoadError(null);
    } catch (err) {
      setLoadError(platformErrorMessage(err, "Could not load the college."));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs one mutation, then reloads the college; shows the API message on failure. */
  const act = async (work: () => Promise<void>, success: string): Promise<boolean> => {
    setBusy(true);
    setNotice(null);
    try {
      await work();
      await load();
      setNotice({ variant: "success", message: success });
      return true;
    } catch (err) {
      setNotice({ variant: "error", message: platformErrorMessage(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Error" message={loadError} />
        <Link to="/Platform" className="text-sm text-brand-500">&larr; Back to colleges</Link>
      </div>
    );
  }
  if (!college || !id) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
  }

  const addBranch = async () => {
    if (!branch.name.trim() || !branch.code.trim()) {
      setNotice({ variant: "error", message: "Branch name and code are required." });
      return;
    }
    const ok = await act(
      async () => {
        await platformService.addBranch(id, { name: branch.name.trim(), code: branch.code.trim() });
      },
      "Branch added.",
    );
    if (ok) setBranch({ name: "", code: "" });
  };

  const addYear = async () => {
    if (!year.full.trim()) {
      setNotice({ variant: "error", message: "Academic year is required (e.g. 2025-2026)." });
      return;
    }
    const ok = await act(
      async () => {
        await platformService.addAcademicYear(id, {
          fullDuration: year.full.trim(),
          shortDuration: year.short.trim() || year.full.trim(),
          setCurrent: year.current,
        });
      },
      "Academic year added.",
    );
    if (ok) setYear({ full: "", short: "", current: false });
  };

  const setCurrent = (ayid: string) =>
    act(async () => {
      await platformService.setCurrentAcademicYear(id, ayid);
    }, "Current academic year changed.");

  const addAdmin = async () => {
    if (!adminForm) return;
    const problem = validateAdmin(adminForm);
    if (problem) {
      setNotice({ variant: "error", message: problem });
      return;
    }
    const ok = await act(
      async () => {
        await platformService.addAdmin(id, {
          ...adminForm,
          firstName: adminForm.firstName.trim(),
          lastName: adminForm.lastName.trim(),
          username: adminForm.username.trim(),
          email: adminForm.email.trim(),
        });
      },
      "Admin added.",
    );
    if (ok) setAdminForm(null);
  };

  const removeAdmin = async (userId: string, email: string) => {
    const confirm = await Swal.fire({
      title: "Remove this admin?",
      text: `${email} will no longer be able to sign in. This frees an admin slot.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    await act(async () => {
      await platformService.removeAdmin(id, userId);
    }, "Admin removed.");
  };

  const adminSlotsFull = college.admins.length >= MAX_ADMINS;

  return (
    <>
      <PageMeta title={`GradeSphere | ${college.name}`} description="College on the platform" />
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link to="/Platform" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400">
            &larr; Colleges
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            {college.name} <span className="text-base font-normal text-gray-500">({college.collegeCode})</span>
          </h2>
        </div>

        {notice && (
          <Alert
            variant={notice.variant}
            title={notice.variant === "success" ? "Done" : "Could not save"}
            message={notice.message}
            onClose={() => setNotice(null)}
          />
        )}

        <ComponentCard title="Overview">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Info k="Centre" v={college.collegeCenter} />
            <Info k="Contact email" v={college.contactEmail} />
            <Info k="Contact phone" v={college.contactPhone} />
            <Info k="Address" v={college.address || "-"} />
            <Info k="Grade scales" v={String(college.gradeScaleCount)} />
            <Info k="Ordinance rule sets" v={String(college.ruleSetCount)} />
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" color={college.hasLogo ? "success" : "light"}>Logo</Badge>
            <Badge size="sm" color={college.hasBanner ? "success" : "light"}>Banner</Badge>
            <span className="mx-1 text-gray-300">|</span>
            {college.patterns.length === 0 && <span className="text-sm text-gray-500">No patterns</span>}
            {college.patterns.map((p) => (
              <Badge key={p.patternId} size="sm" color="info">{p.patternName}</Badge>
            ))}
          </div>
          {(college.gradeScaleCount === 0 || college.ruleSetCount === 0) && (
            <Alert
              variant="warning"
              title="Not ready to process results"
              message="This college has no grade scale or ordinance rule set. Re-provision it with a template college (same college code) to copy them."
            />
          )}
        </ComponentCard>

        <ComponentCard title="Admins" desc={`${college.admins.length} of ${MAX_ADMINS}. Only the platform administrator adds or removes college admins.`}>
          {college.admins.length === 0 && (
            <p className="text-sm text-warning-600 dark:text-warning-500">This college has no admin, so nobody can sign in and manage it.</p>
          )}
          {college.admins.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={HEAD}>Name</TableCell>
                    <TableCell isHeader className={HEAD}>Username</TableCell>
                    <TableCell isHeader className={HEAD}>Email</TableCell>
                    <TableCell isHeader className={HEAD}><span className="sr-only">Actions</span></TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {college.admins.map((a) => (
                    <TableRow key={a.userId}>
                      <TableCell className={CELL}>{a.firstName} {a.lastName}</TableCell>
                      <TableCell className={CELL}>{a.username}</TableCell>
                      <TableCell className={CELL}>{a.email}</TableCell>
                      <TableCell className={`${CELL} text-right`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3 py-1.5 text-error-500"
                          disabled={busy}
                          onClick={() => removeAdmin(a.userId, a.email)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {adminForm ? (
            <div className="space-y-4">
              <AdminFields title="New admin" value={adminForm} onChange={setAdminForm} />
              <div className="flex gap-3">
                <Button size="sm" onClick={addAdmin} disabled={busy}>Add admin</Button>
                <Button size="sm" variant="outline" onClick={() => setAdminForm(null)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          ) : adminSlotsFull ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The limit of {MAX_ADMINS} admins is reached. Remove one to add another.
            </p>
          ) : (
            <div>
              <Button variant="outline" size="sm" startIcon={<Plus className="size-4" />} onClick={() => setAdminForm(emptyAdmin())}>
                Add admin
              </Button>
            </div>
          )}
        </ComponentCard>

        <ComponentCard title="Branches">
          {college.branches.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={HEAD}>Branch</TableCell>
                    <TableCell isHeader className={HEAD}>Code</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {college.branches.map((b) => (
                    <TableRow key={b.courseId}>
                      <TableCell className={CELL}>{b.name}</TableCell>
                      <TableCell className={CELL}>{b.courseCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No branches yet.</p>
          )}
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_12rem_auto]">
            <Input label="Branch name" maxLength={100} value={branch.name} onChange={(e) => setBranch({ ...branch, name: e.target.value })} />
            <Input label="Code" maxLength={20} value={branch.code} onChange={(e) => setBranch({ ...branch, code: e.target.value })} />
            <Button variant="outline" size="sm" className="h-11 py-0" disabled={busy} onClick={addBranch} startIcon={<Plus className="size-4" />}>
              Add branch
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="Academic years" desc="Staff work in the current year; they can switch to others from their header.">
          {college.academicYears.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={HEAD}>Year</TableCell>
                    <TableCell isHeader className={HEAD}>Label</TableCell>
                    <TableCell isHeader className={HEAD}>Status</TableCell>
                    <TableCell isHeader className={HEAD}><span className="sr-only">Actions</span></TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {college.academicYears.map((y) => (
                    <TableRow key={y.ayid}>
                      <TableCell className={CELL}>{y.fullDuration}</TableCell>
                      <TableCell className={CELL}>{y.shortDuration ?? "-"}</TableCell>
                      <TableCell className={CELL}>
                        {y.isCurrent ? <Badge size="sm" color="success">Current</Badge> : <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className={`${CELL} text-right`}>
                        {!y.isCurrent && (
                          <Button size="sm" variant="outline" className="px-3 py-1.5" disabled={busy} onClick={() => setCurrent(y.ayid)}>
                            Set current
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-warning-600 dark:text-warning-500">No academic year: staff cannot work until one is added.</p>
          )}
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            <Input label="Full duration" placeholder="2025-2026" maxLength={50} value={year.full} onChange={(e) => setYear({ ...year, full: e.target.value })} />
            <Input label="Short label" placeholder={year.full || "2025-2026"} maxLength={30} value={year.short} onChange={(e) => setYear({ ...year, short: e.target.value })} hint="Defaults to the full duration." />
            <Checkbox label="Make it the current year" checked={year.current} onChange={(v) => setYear({ ...year, current: v })} />
            <div>
              <Button variant="outline" size="sm" disabled={busy} onClick={addYear} startIcon={<Plus className="size-4" />}>
                Add academic year
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500 dark:text-gray-400">{k}</dt>
      <dd className="mt-0.5 break-words text-gray-800 dark:text-white/90">{v}</dd>
    </div>
  );
}
