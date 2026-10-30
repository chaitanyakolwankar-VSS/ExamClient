import type { ReactNode } from "react";
import { AlertTriangle, Check } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { TextButton } from "./LetterPageParts";

/** One step as the step bar shows it. The summary is shown once the step is done. */
export interface StepState {
  label: string;
  summary: string;
  done: boolean;
  /** A step opens once the one before it is done. */
  reachable: boolean;
}

/** The numbered steps in one compact row: 1 Exam period, 2 Who is on duty, ... Click a step that is reachable to open it. */
export function StepBar({ steps, current, onStep }: { steps: StepState[]; current: number; onStep: (step: number) => void }) {
  return (
    <nav aria-label="Steps">
      <ol className={`grid grid-cols-2 gap-2 ${steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {steps.map((s, i) => {
          const n = i + 1;
          const active = n === current;
          return (
            <li key={s.label} className="min-w-0">
              <button
                type="button"
                disabled={!s.reachable}
                aria-current={active ? "step" : undefined}
                onClick={() => onStep(n)}
                title={s.reachable ? undefined : `Finish step ${n - 1} first`}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-brand-500 bg-brand-50 dark:border-brand-500/60 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:bg-gray-50 disabled:hover:bg-white dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] dark:disabled:hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    s.done ? "bg-brand-500 text-white" : active ? "border-2 border-brand-500 text-brand-600 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400"
                  }`}
                >
                  {s.done ? <Check className="size-3.5" aria-hidden="true" /> : n}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{s.label}</span>
                  {s.done && s.summary && (
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400" title={s.summary}>
                      {s.summary}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface CardProps {
  number: number;
  title: string;
  /** One grey line under the title: what to do in this step. */
  hint?: string;
  /** The padded part of the card. */
  children: ReactNode;
  /** Tables and the like that run edge to edge, under the padded part. */
  flush?: ReactNode;
  footer?: ReactNode;
}

/** One step: a simple card with its title and what to do. */
export function StepCard({ number, title, hint, children, flush, footer }: CardProps) {
  return (
    <section aria-label={`Step ${number}: ${title}`} className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-800">
        <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">Step {number}</span>
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
      <div className="min-w-0 space-y-3 px-4 py-3 sm:px-5">{children}</div>
      {flush}
      {footer && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-800">{footer}</div>}
    </section>
  );
}

/** Back to the step before, Next to the step after. */
export function StepFooter({ onBack, onNext, nextLabel, nextDisabled, nextTitle, right }: { onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextTitle?: string; right?: ReactNode }) {
  return (
    <>
      {onBack ? <TextButton onClick={onBack}>← Back</TextButton> : <span />}
      {right}
      {!right && onNext && (
        <Button size="sm" onClick={onNext} disabled={nextDisabled} title={nextTitle}>
          {nextLabel ?? "Next"} →
        </Button>
      )}
    </>
  );
}

/** A reminder under the step bar while there are changes that are not saved yet, with the ways out. */
export function UnsavedStrip({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
