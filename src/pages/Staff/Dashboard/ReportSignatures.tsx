import { useMemo, useState } from "react";
import Dropzone from "../../../components/form/input/DropZone";
import AuthImage from "../../../components/common/AuthImage";
import Button from "../../../components/ui/button/Button";
import collegedetailService, { CreateCollegePayload } from "../../../services/collegedetailService";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  collegeId: string | null;
  /** The saved college fields; the update endpoint rewrites them, so they are sent unchanged. */
  college: Omit<CreateCollegePayload, "logo" | "banner">;
  controllerSignUrl: string | null;
  principalSignUrl: string | null;
  onSaved: () => void;
  onMessage: (variant: "success" | "error", title: string, message: string) => void;
}

/**
 * Signature images of the Controller of Examinations and the Principal. They print on every
 * marksheet; the Principal's also prints on hall tickets. A missing image leaves a blank line.
 */
const ReportSignatures = ({ collegeId, college, controllerSignUrl, principalSignUrl, onSaved, onMessage }: Props) => {
  const [controllerFile, setControllerFile] = useState<File | null>(null);
  const [principalFile, setPrincipalFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const controllerPreview = useMemo(() => (controllerFile ? URL.createObjectURL(controllerFile) : null), [controllerFile]);
  const principalPreview = useMemo(() => (principalFile ? URL.createObjectURL(principalFile) : null), [principalFile]);

  const pick = (file: File, set: (f: File | null) => void) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onMessage("error", "Invalid image", "Use a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onMessage("error", "Image too large", "The signature image must be under 2 MB.");
      return;
    }
    set(file);
  };

  const save = async () => {
    if (!collegeId) return;
    setSaving(true);
    try {
      await collegedetailService.updateCollege(collegeId, {
        ...college,
        controllerSignature: controllerFile,
        principalSignature: principalFile,
      });
      setControllerFile(null);
      setPrincipalFile(null);
      onSaved();
      onMessage("success", "Saved", "Signatures updated.");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onMessage("error", "Failed", apiMessage ?? "Failed to save the signatures.");
    } finally {
      setSaving(false);
    }
  };

  const slot = (title: string, savedUrl: string | null, preview: string | null, onPick: (f: File) => void, onClear: () => void) => (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-gray-800 dark:text-white/90">{title}</p>
      <div className="flex h-24 items-center justify-center rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700">
        {preview ? (
          <img src={preview} alt={`${title} signature (new)`} className="max-h-20 object-contain" />
        ) : savedUrl ? (
          <AuthImage src={savedUrl} alt={`${title} signature`} className="max-h-20 object-contain" />
        ) : (
          <span className="text-sm text-gray-400">No signature: a blank line is printed</span>
        )}
      </div>
      {preview ? (
        <Button size="sm" variant="outline" onClick={onClear}>Remove new image</Button>
      ) : (
        <Dropzone label={savedUrl ? "Replace signature" : "Upload signature"} onFileSelect={onPick} />
      )}
    </div>
  );

  return (
    <div className="mt-6 rounded-md border p-4 dark:border-gray-800">
      <h4 className="mb-1 font-semibold text-gray-800 dark:text-white/90">Report signatures</h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Printed above the signature lines on marksheets; the Principal&apos;s also on hall tickets. Transparent PNG works best.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {slot("Controller of Examinations", controllerSignUrl, controllerPreview, (f) => pick(f, setControllerFile), () => setControllerFile(null))}
        {slot("Principal", principalSignUrl, principalPreview, (f) => pick(f, setPrincipalFile), () => setPrincipalFile(null))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={!collegeId || saving || (!controllerFile && !principalFile)}>
          {saving ? "Saving..." : "Save signatures"}
        </Button>
      </div>
      {!collegeId && <p className="mt-2 text-sm text-gray-500">Save (or finish editing) the college details first.</p>}
    </div>
  );
};

export default ReportSignatures;
