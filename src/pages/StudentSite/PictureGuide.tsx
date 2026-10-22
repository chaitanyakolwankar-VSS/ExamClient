import type { StudentImageKind } from "../../services/StudentAccessService";

const GUIDE: Record<StudentImageKind, { title: string; sub: string; tips: string[] }> = {
  photo: {
    title: "Photo",
    sub: "Like a passport photo",
    tips: ["Recent, face straight to the camera", "Plain light wall behind you, good light", "No cap, sunglasses or filters"],
  },
  signature: {
    title: "Signature",
    sub: "Your usual signature",
    tips: ["Black or blue pen on white paper", "Take the picture close and straight", "Crop it to just the signature"],
  },
};

/** A small drawing of what a good one looks like. */
function Sample({ kind }: { kind: StudentImageKind }) {
  if (kind === "photo")
    return (
      <svg viewBox="0 0 44 52" aria-hidden className="h-13 w-11 shrink-0 rounded-md border bg-muted">
        <circle cx="22" cy="20" r="8" className="fill-primary/40" />
        <path d="M8 52c0-9 6.3-15 14-15s14 6 14 15z" className="fill-primary/40" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 36" aria-hidden className="mt-2 h-8 w-14 shrink-0 rounded-md border bg-white">
      <path d="M8 24c4-10 7-12 8-8s-2 9 1 8 5-12 8-11-1 10 2 10 4-6 7-6 2 5 5 4 6-5 9-6" fill="none" stroke="#1e3a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** What makes a good photo and signature, under the ID card while either can be added or changed. */
export default function PictureGuide({ kinds }: { kinds: StudentImageKind[] }) {
  if (kinds.length === 0) return null;
  return (
    <section aria-label="How to take them" className="mt-4 rounded-2xl border bg-card px-4">
      <div className="divide-y">
        {kinds.map((kind) => {
          const g = GUIDE[kind];
          return (
            <div key={kind} className="flex gap-3 py-4">
              <span className="flex w-14 shrink-0 justify-center pt-0.5">
                <Sample kind={kind} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {g.title} <span className="font-normal text-muted-foreground">· {g.sub}</span>
                </p>
                <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                  {g.tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      <p className="border-t py-3 text-xs text-muted-foreground">
        A JPG or PNG straight from your phone is fine. We make it smaller before it's saved (photo under 300 KB, signature under 100 KB).
      </p>
    </section>
  );
}
