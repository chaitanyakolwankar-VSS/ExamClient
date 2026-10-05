import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Checkbox from "../../components/form/input/Checkbox";
import FileInput from "../../components/form/input/FileInput";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { platformErrorMessage, platformService } from "../../services/platformService";
import type {
  AdminInput,
  BranchInput,
  PlatformCollegeListItem,
  ProvisionSummary,
} from "../../services/platformService";
import AdminFields from "./AdminFields";
import { EMAIL_RE, MAX_ADMINS, emptyAdmin, validateAdmin, validateImage } from "./platformHelpers";

const STEPS = ["Details", "Setup", "Admins", "Review"];

interface Details {
  name: string;
  collegeCode: string;
  collegeCenter: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

const HEAD = "px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const CELL = "px-3 py-2 text-sm text-gray-700 dark:text-gray-300";

export default function NewCollege() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProvisionSummary | null>(null);

  // step 1
  const [details, setDetails] = useState<Details>({
    name: "", collegeCode: "", collegeCenter: "", address: "", contactEmail: "", contactPhone: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  // step 2
  const [ayFull, setAyFull] = useState("");
  const [ayShort, setAyShort] = useState("");
  const [ayCurrent, setAyCurrent] = useState(true);
  const [branches, setBranches] = useState<BranchInput[]>([{ name: "", code: "" }]);
  const [patterns, setPatterns] = useState<string[]>(["NEP"]);
  const [templateId, setTemplateId] = useState("");
  const [existing, setExisting] = useState<PlatformCollegeListItem[]>([]);

  // step 3
  const [admins, setAdmins] = useState<AdminInput[]>([emptyAdmin()]);

  useEffect(() => {
    let cancelled = false;
    platformService
      .getColleges()
      .then((rows) => {
        if (!cancelled) setExisting(rows);
      })
      .catch(() => {
        /* the template dropdown just stays empty; provisioning without a template is still allowed */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setDetail = (patch: Partial<Details>) => setDetails((d) => ({ ...d, ...patch }));

  const onImage = (file: File | undefined, label: string, set: (f: File | null) => void) => {
    if (!file) {
      set(null);
      return;
    }
    const problem = validateImage(file, label);
    if (problem) {
      setError(problem);
      set(null);
      return;
    }
    setError(null);
    set(file);
  };

  // ---- validation per step: returns the first problem, or null ----
  const checkDetails = (): string | null => {
    if (!details.name.trim()) return "College name is required.";
    if (details.name.trim().length > 50) return "College name must be at most 50 characters.";
    if (!details.collegeCode.trim()) return "College code is required.";
    if (!details.collegeCenter.trim()) return "Centre is required.";
    if (!details.contactEmail.trim() || !EMAIL_RE.test(details.contactEmail.trim())) return "A valid contact email is required.";
    if (!details.contactPhone.trim()) return "Contact phone is required.";
    return null;
  };

  const filledBranches = branches.filter((b) => b.name.trim() || b.code.trim());
  const filledPatterns = patterns.map((p) => p.trim()).filter(Boolean);

  const checkSetup = (): string | null => {
    if (!ayFull.trim()) return "Academic year is required (e.g. 2024-2025).";
    if (filledBranches.length === 0) return "Add at least one branch.";
    if (filledBranches.some((b) => !b.name.trim() || !b.code.trim())) return "Every branch needs a name and a code.";
    const codes = filledBranches.map((b) => b.code.trim().toLowerCase());
    if (new Set(codes).size !== codes.length) return "Branch codes must be unique.";
    if (filledPatterns.length === 0) return "Add at least one pattern (e.g. NEP).";
    if (new Set(filledPatterns.map((p) => p.toLowerCase())).size !== filledPatterns.length) return "Pattern names must be unique.";
    return null;
  };

  const checkAdmins = (): string | null => {
    for (let i = 0; i < admins.length; i++) {
      const problem = validateAdmin(admins[i], `Admin ${i + 1}`);
      if (problem) return problem;
    }
    const emails = admins.map((a) => a.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) return "The two admins need different emails.";
    return null;
  };

  const checks = [checkDetails, checkSetup, checkAdmins];

  const next = () => {
    const problem = checks[step]();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const back = () => {
    setError(null);
    setStep(Math.max(0, step - 1));
  };

  const create = async () => {
    // Re-check everything: the user may have jumped back and edited.
    for (const check of checks) {
      const problem = check();
      if (problem) {
        setError(problem);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const summary = await platformService.provisionCollege({
        name: details.name.trim(),
        collegeCode: details.collegeCode.trim(),
        collegeCenter: details.collegeCenter.trim(),
        address: details.address.trim(),
        contactEmail: details.contactEmail.trim(),
        contactPhone: details.contactPhone.trim(),
        logo,
        banner,
        academicYear: { fullDuration: ayFull.trim(), shortDuration: ayShort.trim() || ayFull.trim(), isCurrent: ayCurrent },
        branches: filledBranches.map((b) => ({ name: b.name.trim(), code: b.code.trim() })),
        patterns: filledPatterns,
        templateCollegeId: templateId || undefined,
        admins: admins.map((a) => ({
          ...a,
          firstName: a.firstName.trim(),
          lastName: a.lastName.trim(),
          username: a.username.trim(),
          email: a.email.trim(),
        })),
      });
      setResult(summary);
    } catch (err) {
      setError(platformErrorMessage(err, "The college could not be created."));
    } finally {
      setSubmitting(false);
    }
  };

  const templateName = existing.find((c) => c.collegeId === templateId);

  // ------------------------------------------------------------------ result
  if (result) {
    return (
      <>
        <PageMeta title="GradeSphere | New college" description="Provision a college" />
        <div className="mx-auto max-w-4xl space-y-6">
          <Alert
            variant="success"
            title={result.alreadyExisted ? "College already existed" : "College created"}
            message={
              result.alreadyExisted
                ? `${result.name} (${result.collegeCode}) was already registered; only the missing parts were added.`
                : `${result.name} (${result.collegeCode}) is ready.`
            }
          />
          {result.warnings.map((w) => (
            <Alert key={w} variant="warning" title="Note" message={w} />
          ))}
          <ComponentCard title="What was created">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={HEAD}>Item</TableCell>
                    <TableCell isHeader className={HEAD}>Created</TableCell>
                    <TableCell isHeader className={HEAD}>Already present</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {result.items.map((i) => (
                    <TableRow key={i.item}>
                      <TableCell className={CELL}>{i.item}</TableCell>
                      <TableCell className={CELL}>{i.created}</TableCell>
                      <TableCell className={CELL}>{i.alreadyPresent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {result.admins.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Admins</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {result.admins.map((a) => (
                    <li key={a.userId}>
                      {a.email} <span className="text-gray-400">({a.status})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ComponentCard>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/Platform/colleges/${result.collegeId}`)}>Open college</Button>
            <Button variant="outline" onClick={() => navigate("/Platform")}>Back to colleges</Button>
          </div>
        </div>
      </>
    );
  }

  // ------------------------------------------------------------------ wizard
  return (
    <>
      <PageMeta title="GradeSphere | New college" description="Provision a college" />
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/Platform" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400">
            &larr; Colleges
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">New college</h2>
        </div>

        <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                i === step
                  ? "border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-500/15"
                  : i < step
                    ? "border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                    : "border-gray-200 text-gray-400 dark:border-gray-800"
              }`}
            >
              <span className="flex size-5 items-center justify-center rounded-full border text-xs">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Check the form" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {step === 0 && (
          <ComponentCard title="College details" desc="Shown on reports and hall tickets.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="College name" maxLength={50} value={details.name} onChange={(e) => setDetail({ name: e.target.value })} />
              <Input label="College code" maxLength={20} value={details.collegeCode} onChange={(e) => setDetail({ collegeCode: e.target.value })} hint="Unique. Re-using an existing code fills in what is missing on that college." />
              <Input label="Centre" maxLength={100} value={details.collegeCenter} onChange={(e) => setDetail({ collegeCenter: e.target.value })} />
              <Input label="Contact phone" maxLength={20} value={details.contactPhone} onChange={(e) => setDetail({ contactPhone: e.target.value })} />
              <Input label="Contact email" type="email" maxLength={255} value={details.contactEmail} onChange={(e) => setDetail({ contactEmail: e.target.value })} />
              <Input label="Address" maxLength={500} value={details.address} onChange={(e) => setDetail({ address: e.target.value })} />
              <div>
                <Label>Logo (optional)</Label>
                <FileInput onChange={(e) => onImage(e.target.files?.[0], "Logo", setLogo)} />
                <p className="mt-1.5 text-xs text-gray-500">JPG, PNG or WEBP, under 2 MB.</p>
              </div>
              <div>
                <Label>Banner (optional)</Label>
                <FileInput onChange={(e) => onImage(e.target.files?.[0], "Banner", setBanner)} />
                <p className="mt-1.5 text-xs text-gray-500">Printed on gazettes, marksheets and hall tickets.</p>
              </div>
            </div>
          </ComponentCard>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <ComponentCard title="Academic year" desc="The year the college starts in. Staff see it in their header.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input label="Full duration" placeholder="2024-2025" maxLength={50} value={ayFull} onChange={(e) => setAyFull(e.target.value)} />
                <Input label="Short label" placeholder={ayFull || "2024-2025"} maxLength={30} value={ayShort} onChange={(e) => setAyShort(e.target.value)} hint="Defaults to the full duration." />
              </div>
              <Checkbox label="Make this the current academic year" checked={ayCurrent} onChange={setAyCurrent} />
            </ComponentCard>

            <ComponentCard title="Branches" desc="Courses of the college. Exams and subjects hang off a branch.">
              {branches.map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_8rem_auto] items-start gap-3 sm:grid-cols-[1fr_12rem_auto]">
                  <Input label="Branch name" maxLength={100} value={b.name} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input label="Code" maxLength={20} value={b.code} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-3 py-0"
                    disabled={branches.length === 1}
                    onClick={() => setBranches(branches.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" startIcon={<Plus className="size-4" />} onClick={() => setBranches([...branches, { name: "", code: "" }])}>
                Add branch
              </Button>
            </ComponentCard>

            <ComponentCard title="Patterns" desc="Marks and eligibility carry the pattern name, e.g. NEP.">
              {patterns.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-start gap-3">
                  <Input label="Pattern name" maxLength={100} value={p} onChange={(e) => setPatterns(patterns.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-3 py-0"
                    disabled={patterns.length === 1}
                    onClick={() => setPatterns(patterns.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" startIcon={<Plus className="size-4" />} onClick={() => setPatterns([...patterns, ""])}>
                Add pattern
              </Button>
            </ComponentCard>

            <ComponentCard
              title="Template college"
              desc="Its grade scale and ordinance rule sets are copied to the new college (rule sets are matched to your patterns by name). Nothing is shared, so the colleges can diverge later."
            >
              <Select
                label="Copy from"
                placeholder="None (no grade scale or ordinance rules)"
                value={templateId}
                onChange={setTemplateId}
                options={[
                  { value: "", label: "None (no grade scale or ordinance rules)" },
                  ...existing.filter((c) => c.isTemplate).map((c) => ({ value: c.collegeId, label: `Starter: ${c.name}` })),
                  ...existing.filter((c) => !c.isTemplate).map((c) => ({ value: c.collegeId, label: `${c.name} (${c.collegeCode})` })),
                ]}
              />
              {!templateId && (
                <p className="text-sm text-warning-600 dark:text-warning-500">
                  Without a template the college cannot process results until a grade scale and rule set are added.
                </p>
              )}
            </ComponentCard>
          </div>
        )}

        {step === 2 && (
          <ComponentCard
            title="College admins"
            desc={`0 to ${MAX_ADMINS}. An admin signs in with their email and manages users, roles and college details. Admins can also be added later.`}
          >
            {admins.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No admin yet.</p>}
            {admins.map((a, i) => (
              <AdminFields
                key={i}
                title={`Admin ${i + 1}`}
                value={a}
                onChange={(nextAdmin) => setAdmins(admins.map((x, j) => (j === i ? nextAdmin : x)))}
                onRemove={() => setAdmins(admins.filter((_, j) => j !== i))}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              startIcon={<Plus className="size-4" />}
              disabled={admins.length >= MAX_ADMINS}
              onClick={() => setAdmins([...admins, emptyAdmin()])}
            >
              Add admin
            </Button>
          </ComponentCard>
        )}

        {step === 3 && (
          <ComponentCard title="Review" desc="Nothing is saved until you press Create. It all happens in one go, or not at all.">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Row k="College" v={`${details.name} (${details.collegeCode})`} />
              <Row k="Centre" v={details.collegeCenter} />
              <Row k="Contact" v={`${details.contactEmail}, ${details.contactPhone}`} />
              <Row k="Address" v={details.address || "-"} />
              <Row k="Logo / banner" v={`${logo ? logo.name : "none"} / ${banner ? banner.name : "none"}`} />
              <Row k="Academic year" v={`${ayFull}${ayShort ? ` (${ayShort})` : ""}${ayCurrent ? ", current" : ""}`} />
              <Row k="Branches" v={filledBranches.map((b) => `${b.name} (${b.code})`).join(", ")} />
              <Row k="Patterns" v={filledPatterns.join(", ")} />
              <Row k="Template" v={templateName ? `${templateName.name} (${templateName.collegeCode})` : "none"} />
              <Row k="Admins" v={admins.length ? admins.map((a) => a.email).join(", ") : "none"} />
            </dl>
          </ComponentCard>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <Button variant="outline" onClick={step === 0 ? () => navigate("/Platform") : back} disabled={submitting}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button onClick={create} disabled={submitting}>
              {submitting ? "Creating..." : "Create college"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500 dark:text-gray-400">{k}</dt>
      <dd className="mt-0.5 break-words text-gray-800 dark:text-white/90">{v}</dd>
    </div>
  );
}
