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

/** Picks a student photo or signature: preview, PNG/JPG/WEBP under 2 MB, read as a data: URL. */
const StudentImagePicker = ({ label, value, savedPath, onChange, onError }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const box = label === "Photo" ? "h-28 w-24" : "h-14 w-40";

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return onError(`${label}: use a PNG, JPG or WEBP image.`);
    if (file.size > MAX_BYTES) return onError(`${label}: the image must be under 2 MB.`);
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${box} flex flex-shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-white dark:border-gray-700`}>
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-contain" />
        ) : savedPath ? (
          <AuthImage src={savedPath} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400">{label}</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {value || savedPath ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-left text-xs text-gray-500 hover:underline">
            Undo
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
