import type { ReactNode } from "react";
import StudentDetailsFields from "./StudentDetailsFields";
import StudentImagePicker from "./StudentImagePicker";
import type { StudentFields } from "./studentFields";

interface Props {
  fields: StudentFields;
  onFieldsChange: (next: StudentFields) => void;
  /** New pictures picked in this form (data: URLs). */
  photo: string | null;
  sign: string | null;
  /** Pictures already saved for the student (edit dialog), shown until a new one is picked. */
  savedPhoto?: string | null;
  savedSign?: string | null;
  onPhotoChange: (dataUrl: string | null) => void;
  onSignChange: (dataUrl: string | null) => void;
  onImageError: (message: string) => void;
  /** Buttons (Clear / Save student, Cancel / Save changes), centred under the fields. */
  actions?: ReactNode;
}

/**
 * Details and buttons on the left, photo over signature in a full-height column on the right; used by
 * "Single student" and the edit dialog. It carries its own cell padding, so put it in a bordered box.
 * Splits into two columns when the form itself is at least 860px wide (a container query, so the page with
 * the sidebar and the edit dialog both split only when the three-column details still have room); stacks otherwise.
 */
export default function StudentForm({
  fields,
  onFieldsChange,
  photo,
  sign,
  savedPhoto,
  savedSign,
  onPhotoChange,
  onSignChange,
  onImageError,
  actions,
}: Props) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 @min-[860px]:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col justify-center gap-6 p-4 sm:p-5">
          <StudentDetailsFields value={fields} onChange={onFieldsChange} />
          {actions && <div className="hidden flex-wrap justify-center gap-3 @min-[860px]:flex">{actions}</div>}
        </div>
        <div className="flex flex-col items-center gap-3 border-t border-gray-100 p-4 sm:p-5 @min-[860px]:border-t-0 @min-[860px]:border-l dark:border-gray-800">
          <StudentImagePicker label="Photo" value={photo} savedPath={savedPhoto} onChange={onPhotoChange} onError={onImageError} />
          <div className="w-44 max-w-full">
            <StudentImagePicker label="Signature" value={sign} savedPath={savedSign} onChange={onSignChange} onError={onImageError} />
          </div>
          <p className="max-w-44 text-center text-xs leading-snug text-gray-500 dark:text-gray-400">
            Click a box to upload. JPG or PNG, under&nbsp;2&nbsp;MB.
          </p>
        </div>
        {/* Stacked: the buttons come last, after the pictures. */}
        {actions && (
          <div className="flex flex-wrap justify-center gap-3 border-t border-gray-100 p-4 sm:p-5 @min-[860px]:hidden dark:border-gray-800">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
