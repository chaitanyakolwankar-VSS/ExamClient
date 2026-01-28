import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import DataTable from "../../../components/ui/table/DataTable";
import Swal from "sweetalert2";
import {
  OrdinanceService,
  PatternData,
} from "../../../services/OrdinanceService";
import Alert from "../../../components/ui/alert/Alert";

interface Option {
  value: string;
  label: string;
}

type AlertInfo = {
  variant: "success" | "warning" | "error";
  title: string;
  message: string;
};

const allowedCharsRegex = /^[a-zA-Z0-9\-[\]()\s]*$/;

export default function Ordinance() {
  // Page-level state
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<AlertInfo | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  const [patternName, setPatternName] = useState("");
  const [patternDescription, setPatternDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalAlert, setModalAlert] = useState<AlertInfo | null>(null);

  const filters = useMemo(() => ({}), []);

  // Effect to clear alerts
  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);
  useEffect(() => {
    if (modalAlert) {
      const timer = setTimeout(() => setModalAlert(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [modalAlert]);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setPatternName("");
    setPatternDescription("");
    setEditingPatternId(null);
  };

  const fetchPatterns = async (showAlertInModal = false) => {
    setLoading(true);
    try {
      const data = await OrdinanceService.getPatterns();
      setPatterns(data);
      setPatternOptions(
        data.map((p) => ({ value: p.patternId || "", label: p.patternName })),
      );
    } catch (error) {
      const alertPayload = {
        variant: "error" as const,
        title: "Error",
        message: "Failed to fetch patterns.",
      };
      if (showAlertInModal) setModalAlert(alertPayload);
      else setPageAlert(alertPayload);
    } finally {
      setLoading(false);
    }
  };

  const openModalForNew = () => {
    resetForm();
    setModalAlert(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (patternToEdit: PatternData) => {
    setIsEditing(true);
    setEditingPatternId(patternToEdit.patternId || null);
    setPatternName(patternToEdit.patternName);
    setPatternDescription(patternToEdit.description);
    setModalAlert(null);
    setIsModalOpen(true);
  };

  const handleSaveOrUpdatePattern = async () => {
    if (!patternName.trim()) {
      setModalAlert({
        variant: "warning",
        title: "Validation Error",
        message: "Pattern Name cannot be empty.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: PatternData = {
        patternId: isEditing ? editingPatternId! : undefined,
        patternName: patternName,
        description: patternDescription,
      };
      const response = isEditing
        ? await OrdinanceService.updatePattern(payload)
        : await OrdinanceService.savePattern(payload);

      if (response.success) {
        setModalAlert({
          variant: "success",
          title: "Success!",
          message: response.message,
        });
        resetForm();
        await fetchPatterns(true); // Re-fetch data and show alert inside modal
      } else {
        setModalAlert({
          variant: "error",
          title: "Error!",
          message: response.message || "Operation failed.",
        });
      }
    } catch (error) {
      setModalAlert({
        variant: "error",
        title: "Error!",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePattern = async (patternId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await OrdinanceService.deletePattern(patternId);
          if (response.success) {
            setModalAlert({
              variant: "success",
              title: "Deleted!",
              message: response.message,
            });
            fetchPatterns(true); // Re-fetch data
          } else {
            setModalAlert({
              variant: "error",
              title: "Error!",
              message: response.message || "Failed to delete pattern.",
            });
          }
        } catch (error) {
          setModalAlert({
            variant: "error",
            title: "Error!",
            message: "An unexpected error occurred.",
          });
        }
      }
    });
  };

  const patternColumns = [
    { key: "patternName", label: "Pattern Name", sortable: true },
    { key: "description", label: "Description", sortable: false },
    {
      key: "actions",
      label: "Actions",
      render: (row: PatternData) => (
        <div className="flex gap-2 justify-end">
          <Button
            className="border-green-800 text-green-800 hover:bg-green-100"
            variant="outline"
            size="sm"
            onClick={() => openModalForEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-800 text-red-800 hover:bg-red-100"
            onClick={() => handleDeletePattern(row.patternId || "")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-6">
        <ComponentCard title="Ordinance Editor">
          {pageAlert && (
            <Alert
              variant={pageAlert.variant}
              title={pageAlert.title}
              message={pageAlert.message}
            />
          )}
          <div className="flex items-center gap-2">
            <div className="w-72">
              <Select
                options={patternOptions}
                placeholder="Select Pattern"
                value={pattern}
                onChange={(value) => setPattern(value)}
                disabled={loading}
              />
            </div>
            <Button variant="outline" size="sm" onClick={openModalForNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </ComponentCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl p-6"
      >
        <h2 className="text-xl font-semibold my-4">
          {isEditing ? "Edit Pattern" : "Manage Patterns"}
        </h2>
        <div className="space-y-4 pb-4 mb-4">
          <Input
            label="Pattern Name"
            value={patternName}
            onChange={(e) => {
                if (allowedCharsRegex.test(e.target.value)) {
                    setPatternName(e.target.value);
                }
            }}
            placeholder="Enter new or edit existing pattern name"
            maxLength={50}
          />
          <Input
            label="Description"
            value={patternDescription}
            onChange={(e) => {
                if (allowedCharsRegex.test(e.target.value)) {
                    setPatternDescription(e.target.value)
                }
            }}
            maxLength={200}
          />
        </div>
        <div className="mt-4 flex justify-end items-center gap-3">
          <div className="flex-grow min-h-10">
            {modalAlert && (
              <Alert
                variant={modalAlert.variant}
                title={modalAlert.title}
                message={modalAlert.message}
              />
            )}
          </div>
          <Button
            variant="outline"
            className=" text-green-800 border-green-800 hover:bg-green-100"
            onClick={handleSaveOrUpdatePattern}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Pattern"
                : "Save Pattern"}
          </Button>
          <Button
            className=" text-red-800 border-red-800 hover:bg-red-100"
            variant="outline"
            onClick={resetForm}
          >
            Clear
          </Button>
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Existing Patterns</h3>
        <div>
          <DataTable
            data={patterns}
            columns={patternColumns}
            searchKeys={["patternName", "description"]}
            filters={filters}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
        <div className="border-t mt-6 pt-4 flex justify-end">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
