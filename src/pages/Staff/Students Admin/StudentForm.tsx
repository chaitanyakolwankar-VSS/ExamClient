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
}

/**
 * Details on the left (3 rows), photo + signature on the right; used by "Add student" and the edit dialog.
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
}: Props) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-5 @min-[860px]:grid-cols-[minmax(0,1fr)_280px] @min-[860px]:gap-6">
        <StudentDetailsFields value={fields} onChange={onFieldsChange} />
        <div className="flex items-start gap-4 border-t border-gray-100 pt-5 @min-[860px]:border-t-0 @min-[860px]:border-l @min-[860px]:pt-0 @min-[860px]:pl-5 dark:border-gray-800">
          <StudentImagePicker label="Photo" value={photo} savedPath={savedPhoto} onChange={onPhotoChange} onError={onImageError} />
          <div className="flex w-full max-w-60 min-w-0 flex-col gap-3">
            <StudentImagePicker label="Signature" value={sign} savedPath={savedSign} onChange={onSignChange} onError={onImageError} />
            <p className="text-xs leading-snug text-gray-500 dark:text-gray-400">
              Click a box to upload. JPG or PNG, under 2 MB. Printed on the hall ticket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
