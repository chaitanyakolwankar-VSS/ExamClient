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
  sealUrl: string | null;
  onSaved: () => void;
  onMessage: (variant: "success" | "error", title: string, message: string) => void;
}

/**
 * Signature images of the Controller of Examinations and the Principal, and the office round seal. The
 * signatures print on every marksheet and hall ticket, the seal on hall tickets. A missing image leaves a blank.
 */
const ReportSignatures = ({ collegeId, college, controllerSignUrl, principalSignUrl, sealUrl, onSaved, onMessage }: Props) => {
  const [controllerFile, setControllerFile] = useState<File | null>(null);
  const [principalFile, setPrincipalFile] = useState<File | null>(null);
  const [sealFile, setSealFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const controllerPreview = useMemo(() => (controllerFile ? URL.createObjectURL(controllerFile) : null), [controllerFile]);
  const principalPreview = useMemo(() => (principalFile ? URL.createObjectURL(principalFile) : null), [principalFile]);
  const sealPreview = useMemo(() => (sealFile ? URL.createObjectURL(sealFile) : null), [sealFile]);

  const pick = (file: File, set: (f: File | null) => void) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onMessage("error", "Invalid image", "Use a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onMessage("error", "Image too large", "The image must be under 2 MB.");
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
        seal: sealFile,
      });
      setControllerFile(null);
      setPrincipalFile(null);
      setSealFile(null);
      onSaved();
      onMessage("success", "Saved", "Signatures and seal updated.");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onMessage("error", "Failed", apiMessage ?? "Failed to save the images.");
    } finally {
      setSaving(false);
    }
  };

  const slot = (title: string, what: string, savedUrl: string | null, preview: string | null, onPick: (f: File) => void, onClear: () => void, empty: string) => (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-gray-800 dark:text-white/90">{title}</p>
      <div className="flex h-24 items-center justify-center rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700">
        {preview ? (
          <img src={preview} alt={`${title} (new)`} className="max-h-20 object-contain" />
        ) : savedUrl ? (
          <AuthImage src={savedUrl} alt={title} className="max-h-20 object-contain" />
        ) : (
          <span className="text-center text-sm text-gray-400">{empty}</span>
        )}
      </div>
      {preview ? (
        <Button size="sm" variant="outline" onClick={onClear}>Remove new image</Button>
      ) : (
        <Dropzone label={savedUrl ? `Replace ${what}` : `Upload ${what}`} onFileSelect={onPick} />
      )}
    </div>
  );

  return (
    <div className="mt-6 rounded-md border p-4 dark:border-gray-800">
      <h4 className="mb-1 font-semibold text-gray-800 dark:text-white/90">Signatures and seal</h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Signatures print above the signature lines on marksheets and hall tickets; the round seal prints at the bottom of hall tickets. Transparent PNG works best.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {slot("Controller of Examinations", "signature", controllerSignUrl, controllerPreview, (f) => pick(f, setControllerFile), () => setControllerFile(null), "No signature: a blank line is printed")}
        {slot("Principal", "signature", principalSignUrl, principalPreview, (f) => pick(f, setPrincipalFile), () => setPrincipalFile(null), "No signature: a blank line is printed")}
        {slot("Office seal (round stamp)", "seal", sealUrl, sealPreview, (f) => pick(f, setSealFile), () => setSealFile(null), "No seal: an empty circle is printed to stamp by hand")}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={!collegeId || saving || (!controllerFile && !principalFile && !sealFile)}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {!collegeId && <p className="mt-2 text-sm text-gray-500">Save (or finish editing) the college details first.</p>}
    </div>
  );
};

export default ReportSignatures;
