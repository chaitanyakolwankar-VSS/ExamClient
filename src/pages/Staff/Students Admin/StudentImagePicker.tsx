import { useRef } from "react";
import AuthImage from "../../../components/common/AuthImage";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  label: "Photo" | "Signature";
  /** A new image picked here, as a data: URL (what the API stores). */
  value: string | null;
  /** The image already saved for the student (stored path), shown until a new one is picked. */
  savedPath?: string | null;
  onChange: (dataUrl: string | null) => void;
  onError: (message: string) => void;
}

/**
 * A fixed-size box for a student photo (passport 3:4) or signature (wide): click the box to pick an image
 * (PNG/JPG/WEBP under 2 MB, read as a data: URL). The box never changes size, so the form around it stays put.
 */
const StudentImagePicker = ({ label, value, savedPath, onChange, onError }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const isPhoto = label === "Photo";
  const box = isPhoto ? "h-32 w-24" : "h-14 w-44";
  const shown = value ?? savedPath ?? null;

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return onError(`${label}: use a PNG, JPG or WEBP image.`);
    if (file.size > MAX_BYTES) return onError(`${label}: the image must be under 2 MB.`);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        title={shown ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        className={`${box} group relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-brand-500`}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-contain" />
        ) : savedPath ? (
          <AuthImage src={savedPath} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs leading-tight">
            {isPhoto ? "Photo" : "Signature"}
            <br />
            <span className="text-[11px] text-gray-400">click to upload</span>
          </span>
        )}
        {shown && (
          <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Change
          </span>
        )}
      </button>
      <div className="flex h-4 items-center gap-2 text-xs text-gray-500">
        <span>{label}</span>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-brand-500 hover:underline">
            {savedPath ? "Undo" : "Remove"}
          </button>
        )}
      </div>
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
