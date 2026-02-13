import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onFileSelect?: (file: File) => void;
  label?: string;
}

const Dropzone = ({ onFileSelect, label }: DropzoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview setup
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Pass file to parent
    if (onFileSelect) onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="border-2 border-dashed p-4 rounded-md cursor-pointer" {...getRootProps()}>
      <input {...getInputProps()} />
      {label && <p className="mb-2 text-sm text-gray-600">{label}</p>}

      {preview ? (
        <img src={preview} className="h-32 object-contain" />
      ) : (
        <div className="text-center text-gray-500">
          {isDragActive ? "Drop the files here..." : "Drag & drop or click to upload"}
        </div>
      )}
    </div>
  );
};

export default Dropzone;
