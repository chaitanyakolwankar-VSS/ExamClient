import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Alert from "../../../components/ui/alert/Alert";
import {
  MarksEntryService,
  ResolutionConfig,
  ResolutionConfigSubject,
} from "../../../services/MarksEntryService";

/** The server stores the limit as an int32. */
const MAX_LIMIT = 2147483647;

interface ResolutionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  config: ResolutionConfig | null;
  /** Subject currently open on the Marks Entry screen; its row is highlighted. */
  selectedSubjectId?: string;
  /** Called after a successful save so the caller can reload the config. */
  onSaved: (message: string) => void;
}

/** Draft limit text per head (head-wise) and per combined subject (value + carrying head). */
interface Draft {
  headLimit: Record<string, string>;
  combinedLimit: Record<string, string>;
  combinedHead: Record<string, string>;
}

const buildDraft = (config: ResolutionConfig): Draft => {
  const draft: Draft = { headLimit: {}, combinedLimit: {}, combinedHead: {} };
  for (const subject of config.subjects) {
    if (subject.passingStrategy === "Combined") {
      const selected =
        subject.selectedHeadSubjectCreditId ?? subject.heads[0]?.subjectCreditId ?? "";
      draft.combinedHead[subject.subjectId] = selected;
      const carrying = subject.heads.find(h => h.subjectCreditId === selected);
      // An explicit 0 is shown as 0, not as an empty box.
      draft.combinedLimit[subject.subjectId] = String(carrying?.limit ?? 0);
    } else {
      for (const head of subject.heads) {
        draft.headLimit[head.subjectCreditId] = String(head.limit);
      }
    }
  }
  return draft;
};

const toNumber = (text: string | undefined) => (text ? Number(text) : 0);

/** How many of these shortfalls a limit would fully close. */
const countWithin = (deficits: number[], limit: number) =>
  limit > 0 ? deficits.filter(d => d <= limit).length : 0;

const selectClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ResolutionConfigModal({
  isOpen,
  onClose,
  examId,
  config,
  selectedSubjectId,
  onSaved,
}: ResolutionConfigModalProps) {
  const [draft, setDraft] = useState<Draft>({ headLimit: {}, combinedLimit: {}, combinedHead: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from what is saved every time the dialog opens or the config is reloaded.
  useEffect(() => {
    if (isOpen && config) {
      setDraft(buildDraft(config));
      setError(null);
    }
  }, [isOpen, config]);

  const saved = useMemo(() => (config ? buildDraft(config) : null), [config]);

  // Blank and 0 mean the same thing, so compare the numbers rather than the typed text.
  const isDirty = useMemo(() => {
    if (!saved) return false;
    const normalise = (d: Draft) =>
      JSON.stringify([
        Object.entries(d.headLimit).map(([k, v]) => [k, toNumber(v)]),
        Object.entries(d.combinedLimit).map(([k, v]) => [k, toNumber(v)]),
        d.combinedHead,
      ]);
    return normalise(saved) !== normalise(draft);
  }, [saved, draft]);

  const hasInvalid = useMemo(() => {
    const values = [...Object.values(draft.headLimit), ...Object.values(draft.combinedLimit)];
    return values.some(v => toNumber(v) > MAX_LIMIT);
  }, [draft]);

  const isLocked = config?.isLocked ?? false;

  const setHeadLimit = (subjectCreditId: string, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setDraft(prev => ({ ...prev, headLimit: { ...prev.headLimit, [subjectCreditId]: digits } }));
  };

  const setCombinedLimit = (subjectId: string, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setDraft(prev => ({ ...prev, combinedLimit: { ...prev.combinedLimit, [subjectId]: digits } }));
  };

  const setCombinedHead = (subjectId: string, subjectCreditId: string) => {
    setDraft(prev => ({ ...prev, combinedHead: { ...prev.combinedHead, [subjectId]: subjectCreditId } }));
  };

  const handleSave = async () => {
    if (!config) return;
    if (hasInvalid) {
      setError(`Resolution cannot exceed ${MAX_LIMIT.toLocaleString()}.`);
      return;
    }

    // One entry per head. A combined subject keeps its limit on the selected head only, and every
    // other head is sent as 0 so a limit moved to another head is cleared from the old one.
    const limits: { subjectCreditId: string; limit: number }[] = [];
    for (const subject of config.subjects) {
      if (subject.passingStrategy === "Combined") {
        const carrier = draft.combinedHead[subject.subjectId];
        const value = toNumber(draft.combinedLimit[subject.subjectId]);
        for (const head of subject.heads) {
          limits.push({
            subjectCreditId: head.subjectCreditId,
            limit: head.subjectCreditId === carrier ? value : 0,
          });
        }
      } else {
        for (const head of subject.heads) {
          limits.push({
            subjectCreditId: head.subjectCreditId,
            limit: toNumber(draft.headLimit[head.subjectCreditId]),
          });
        }
      }
    }

    setSaving(true);
    setError(null);
    try {
      const res = await MarksEntryService.saveResolutionConfig({ examId, limits });
      if (res.success) {
        onSaved("Saved. Applies on next Process Results.");
        onClose();
      } else {
        setError(res.message || "Could not save resolution.");
      }
    } catch {
      setError("Failed to save resolution.");
    } finally {
      setSaving(false);
    }
  };

  const renderHeadLines = (subject: ResolutionConfigSubject) =>
    subject.heads.map(head => (
      <div key={head.subjectCreditId} className="flex h-11 items-center gap-2 whitespace-nowrap">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {head.headType || head.head}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Out {head.outOf} · Pass {head.passing}
        </span>
      </div>
    ));

  const renderResolutionCell = (subject: ResolutionConfigSubject) => {
    if (subject.passingStrategy === "Combined") {
      const limit = toNumber(draft.combinedLimit[subject.subjectId]);
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-24">
              <Input
                type="text"
                className="text-center"
                placeholder="0"
                value={draft.combinedLimit[subject.subjectId] ?? ""}
                disabled={isLocked}
                error={limit > MAX_LIMIT}
                onChange={e => setCombinedLimit(subject.subjectId, e.target.value)}
              />
            </div>
            <div className="w-28">
              <select
                className={selectClasses}
                value={draft.combinedHead[subject.subjectId] ?? ""}
                disabled={isLocked}
                onChange={e => setCombinedHead(subject.subjectId, e.target.value)}
                aria-label={`Head carrying the resolution for ${subject.subjectName}`}
              >
                {subject.heads.map(head => (
                  <option key={head.subjectCreditId} value={head.subjectCreditId}>
                    {head.headType || head.head}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            On the combined marks: {countWithin(subject.deficits, limit)} of {subject.deficits.length} failing student(s) within limit.
          </p>
        </div>
      );
    }

    return (
      <div>
        {subject.heads.map(head => {
          const limit = toNumber(draft.headLimit[head.subjectCreditId]);
          return (
            <div key={head.subjectCreditId} className="flex h-11 items-center gap-2">
              <div className="w-24">
                <Input
                  type="text"
                  className="text-center"
                  placeholder="0"
                  value={draft.headLimit[head.subjectCreditId] ?? ""}
                  disabled={isLocked}
                  error={limit > MAX_LIMIT}
                  onChange={e => setHeadLimit(head.subjectCreditId, e.target.value)}
                />
              </div>
              <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                {countWithin(head.deficits, limit)} of {head.deficits.length} failing within limit
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolution (^)" className="max-w-6xl mx-4 mb-8">
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Resolution is applied when results are processed; resolved heads/subjects receive no ordinance grace.
          A head-wise subject takes a limit on each head; a combined subject is judged on its total, so pick
          the one head that carries the limit. The limit is a whole number of marks with no upper bound; 0 turns it off.
        </p>

        {isLocked && (
          <Alert variant="warning" title="Exam locked" message="This exam is locked, so resolution can no longer be changed." />
        )}
        {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

        {!config ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : config.subjects.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No subjects with entered marks were found for this exam.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Strategy</th>
                  <th className="px-4 py-3 font-medium">Type · Out · Pass</th>
                  <th className="px-4 py-3 font-medium">Resolution</th>
                  <th className="px-4 py-3 text-center font-medium">Failing</th>
                  <th className="px-4 py-3 text-center font-medium">Would be condoned</th>
                  <th className="px-4 py-3 text-center font-medium">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {config.subjects.map(subject => (
                  <tr
                    key={subject.subjectId}
                    className={
                      subject.subjectId === selectedSubjectId
                        ? "bg-brand-50/50 align-top dark:bg-brand-500/10"
                        : "align-top"
                    }
                  >
                    <td className="px-4 py-2">
                      <div className="flex h-11 flex-col justify-center">
                        <span className="font-medium text-gray-800 dark:text-white/90">{subject.subjectCode}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{subject.subjectName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex h-11 flex-col justify-center text-xs text-gray-700 dark:text-gray-300">
                        <span>{subject.passingStrategy === "Combined" ? "Combined" : "Head-wise"}</span>
                        {subject.passingStrategy === "Combined" && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Pass {subject.requiredToPass}/{subject.outOfTotal}
                            {subject.passPercentage ? ` (${subject.passPercentage}%)` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{renderHeadLines(subject)}</td>
                    <td className="px-4 py-2">{renderResolutionCell(subject)}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex h-11 items-center justify-center text-gray-800 dark:text-white/90">
                        {subject.failingCount}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex h-11 items-center justify-center text-gray-800 dark:text-white/90">
                        {subject.withinLimitCount}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex h-11 items-center justify-center text-gray-800 dark:text-white/90">
                        {subject.appliedCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Failing and Would be condoned are computed from the saved limits and the raw marks; Applied counts students
          holding a resolution after the last Process Results. The hints under each box update as you type.
        </p>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={saving} className="h-11">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isDirty || hasInvalid || isLocked || !config}
            className="h-11"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
