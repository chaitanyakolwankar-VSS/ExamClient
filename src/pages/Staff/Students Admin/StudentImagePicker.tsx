import { useId, useRef } from "react";
import { ImagePlus, Info, PenLine, RotateCcw, X } from "lucide-react";
import AuthImage from "../../../components/common/AuthImage";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_RULES = "Click a box to upload. JPG, PNG or WEBP, under 2 MB.";

interface Props {
  label: "Photo" | "Signature";
  /** A new image picked here, as a data: URL (what the API stores). */
  value: string | null;
  /** The image already saved for the student (stored path), shown until a new one is picked. */
  savedPath?: string | null;
  onChange: (dataUrl: string | null) => void;
  onError: (message: string) => void;
  /** Shows a small (i) beside the label with the upload rules. */
  showRules?: boolean;
}

/**
 * A fixed-size box for a student photo (passport 3:4, 96x128) or signature (176x56), drawn like the form's
 * inputs: same border, radius and a label on the border. Click it to pick an image (PNG/JPG/WEBP under 2 MB,
 * read as a data: URL). The box never changes size with the picture, so the form around it stays put.
 */
const StudentImagePicker = ({ label, value, savedPath, onChange, onError, showRules }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const tipId = useId();
  const isPhoto = label === "Photo";
  const shown = value ?? savedPath ?? null;
  const Icon = isPhoto ? ImagePlus : PenLine;

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return onError(`${label}: use a PNG, JPG or WEBP image.`);
    if (file.size > MAX_BYTES) return onError(`${label}: the image must be under 2 MB.`);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className={`relative shrink-0 ${isPhoto ? "h-32 w-24" : "h-14 w-44"}`}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={shown ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        className="group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-transparent text-gray-400 shadow-theme-xs transition-colors hover:border-brand-300 hover:text-brand-500 focus:outline-hidden focus-visible:border-brand-300 focus-visible:ring-3 focus-visible:ring-brand-500/20 dark:border-gray-700 dark:text-gray-500 dark:hover:border-brand-800 dark:hover:text-brand-400"
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-contain p-1" />
        ) : savedPath ? (
          <AuthImage src={savedPath} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className={`flex items-center text-xs ${isPhoto ? "flex-col gap-1.5" : "gap-2"}`}>
            <Icon size={isPhoto ? 22 : 18} strokeWidth={1.6} aria-hidden />
            Upload
          </span>
        )}
        {shown && (
          <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Change
          </span>
        )}
      </button>

      <span className="absolute left-2 top-0 flex -translate-y-1/2 items-center gap-1 bg-white px-1.5 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        {label}
        {showRules && (
          <span className="group/tip relative flex">
            <button
              type="button"
              aria-describedby={tipId}
              aria-label="Upload rules"
              className="rounded-full text-gray-400 hover:text-brand-500 focus:outline-hidden focus-visible:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <Info size={13} aria-hidden />
            </button>
            <span
              id={tipId}
              role="tooltip"
              className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-1.5 w-44 -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-center text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-focus-within/tip:visible group-focus-within/tip:opacity-100 group-hover/tip:visible group-hover/tip:opacity-100 dark:bg-gray-700"
            >
              {IMAGE_RULES}
            </span>
          </span>
        )}
      </span>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={savedPath ? `Undo ${label.toLowerCase()} change` : `Remove ${label.toLowerCase()}`}
          title={savedPath ? "Undo" : "Remove"}
          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-500 shadow-theme-xs hover:text-error-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:bg-gray-800/90 dark:text-gray-300"
        >
          {savedPath ? <RotateCcw size={12} aria-hidden /> : <X size={12} aria-hidden />}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default StudentImagePicker;
