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
  RuleSetData,
} from "../../../services/OrdinanceService";
import Alert from "../../../components/ui/alert/Alert";
// import Checkbox from "../../../components/form/input/Checkbox";
import Switch from "../../../components/form/switch/Switch"; // Import Switch

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
  const [ruleSets, setRuleSets] = useState<RuleSetData[]>([]);
  const [ruleSetOptions, setRuleSetOptions] = useState<Option[]>([]);
  const [ruleSet, setRuleSet] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<AlertInfo | null>(null);

  // Pattern Modal State
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [isEditingPattern, setIsEditingPattern] = useState(false);
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  const [patternName, setPatternName] = useState("");
  const [patternDescription, setPatternDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patternModalAlert, setPatternModalAlert] = useState<AlertInfo | null>(
    null,
  );

  // RuleSet Modal State
  const [isRuleSetModalOpen, setIsRuleSetModalOpen] = useState(false);
  const [isEditingRuleSet, setIsEditingRuleSet] = useState(false);
  const [editingRuleSetId, setEditingRuleSetId] = useState<string | null>(null);
  const [ruleSetName, setRuleSetName] = useState("");
  const [isRuleSetActive, setIsRuleSetActive] = useState(false);
  const [ruleSetModalAlert, setRuleSetModalAlert] = useState<AlertInfo | null>(
    null,
  );

  const filters = useMemo(() => ({}), []);

  // --- Effects ---
  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);
  useEffect(() => {
    if (patternModalAlert) {
      const timer = setTimeout(() => setPatternModalAlert(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [patternModalAlert]);
  useEffect(() => {
    if (ruleSetModalAlert) {
      const timer = setTimeout(() => setRuleSetModalAlert(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [ruleSetModalAlert]);

  useEffect(() => {
    fetchPatterns();
  }, []);

  useEffect(() => {
    if (pattern) {
      fetchRuleSets(pattern);
    } else {
      setRuleSets([]);
      setRuleSetOptions([]);
      setRuleSet("");
    }
  }, [pattern]);

  // --- Pattern Functions ---
  const resetPatternForm = () => {
    setIsEditingPattern(false);
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
      if (showAlertInModal) setPatternModalAlert(alertPayload);
      else setPageAlert(alertPayload);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrUpdatePattern = async () => {
    if (!patternName.trim()) {
      setPatternModalAlert({
        variant: "warning",
        title: "Validation Error",
        message: "Pattern Name cannot be empty.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: PatternData = {
        patternId: isEditingPattern ? editingPatternId! : undefined,
        patternName: patternName,
        description: patternDescription,
      };
      const response = isEditingPattern
        ? await OrdinanceService.updatePattern(payload)
        : await OrdinanceService.savePattern(payload);

      if (response.success) {
        setPatternModalAlert({
          variant: "success",
          title: "Success!",
          message: response.message,
        });
        resetPatternForm();
        await fetchPatterns(true);
      } else {
        setPatternModalAlert({
          variant: "error",
          title: "Error!",
          message: response.message || "Operation failed.",
        });
      }
    } catch (error) {
      setPatternModalAlert({
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
      title: "Confirm Delete of Pattern?",
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
            setPatternModalAlert({
              variant: "success",
              title: "Deleted!",
              message: response.message,
            });
            fetchPatterns(true);
          } else {
            setPatternModalAlert({
              variant: "error",
              title: "Error!",
              message: response.message || "Failed to delete pattern.",
            });
          }
        } catch (error) {
          setPatternModalAlert({
            variant: "error",
            title: "Error!",
            message: "An unexpected error occurred.",
          });
        }
      }
    });
  };

  const openPatternModalForNew = () => {
    resetPatternForm();
    setPatternModalAlert(null);
    setIsPatternModalOpen(true);
  };

  const openPatternModalForEdit = (patternToEdit: PatternData) => {
    setIsEditingPattern(true);
    setEditingPatternId(patternToEdit.patternId || null);
    setPatternName(patternToEdit.patternName);
    setPatternDescription(patternToEdit.description);
    setPatternModalAlert(null);
    setIsPatternModalOpen(true);
  };

  // --- RuleSet Functions ---
  const resetRuleSetForm = () => {
    setIsEditingRuleSet(false);
    setRuleSetName("");
    setIsRuleSetActive(false);
    setEditingRuleSetId(null);
  };

  const fetchRuleSets = async (patternId: string, showAlertInModal = false) => {
    try {
      const data = await OrdinanceService.getRuleSets(patternId);
      setRuleSets(data);
      setRuleSetOptions(
        data
          .filter((rs) => rs.isActive)
          .map((rs) => ({ value: rs.ruleSetId || "", label: rs.name })),
      );
    } catch (error) {
      const alertPayload = {
        variant: "error" as const,
        title: "Error",
        message: "Failed to fetch RuleSets.",
      };
      if (showAlertInModal) setRuleSetModalAlert(alertPayload);
      else setPageAlert(alertPayload);
    }
  };

  const openRuleSetModalForNew = () => {
    resetRuleSetForm();
    setRuleSetModalAlert(null);
    setIsRuleSetModalOpen(true);
    setIsRuleSetActive(false);
  };

  const openRuleSetModalForEdit = (ruleSetToEdit: RuleSetData) => {
    setIsEditingRuleSet(true);
    setEditingRuleSetId(ruleSetToEdit.ruleSetId!);
    setRuleSetName(ruleSetToEdit.name);
    setIsRuleSetActive(ruleSetToEdit.isActive);
    setRuleSetModalAlert(null);
    setIsRuleSetModalOpen(true);
  };

  const handleSaveOrUpdateRuleSet = async () => {
    if (!ruleSetName.trim()) {
      setRuleSetModalAlert({
        variant: "warning",
        title: "Validation Error",
        message: "RuleSet Name cannot be empty.",
      });
      return;
    }
    if (!pattern) {
      setRuleSetModalAlert({
        variant: "error",
        title: "Error",
        message: "A pattern must be selected.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: RuleSetData = {
        ruleSetId: isEditingRuleSet ? editingRuleSetId! : undefined,
        name: ruleSetName,
        isActive: isRuleSetActive,
        patternId: pattern,
      };

      const response = isEditingRuleSet
        ? await OrdinanceService.updateRuleSet(payload)
        : await OrdinanceService.saveRuleSet(payload);

      if (response.success) {
        setRuleSetModalAlert({
          variant: "success",
          title: "Success!",
          message: response.message,
        });
        resetRuleSetForm();
        await fetchRuleSets(pattern, true);
      } else {
        setRuleSetModalAlert({
          variant: "error",
          title: "Error!",
          message: response.message || "Operation failed.",
        });
      }
    } catch (error) {
      setRuleSetModalAlert({
        variant: "error",
        title: "Error!",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRuleSet = async (ruleSetId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will delete the ruleset and all associated rules!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await OrdinanceService.deleteRuleSet(ruleSetId);
          if (response.success) {
            setRuleSetModalAlert({
              variant: "success",
              title: "Deleted!",
              message: response.message,
            });
            fetchRuleSets(pattern, true);
          } else {
            setRuleSetModalAlert({
              variant: "error",
              title: "Error!",
              message: response.message || "Failed to delete ruleset.",
            });
          }
        } catch (error) {
          setRuleSetModalAlert({
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
            onClick={() => openPatternModalForEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.patternId && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-800 text-red-800 hover:bg-red-100"
              onClick={() => handleDeletePattern(row.patternId!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ruleSetColumns = [
    { key: "name", label: "RuleSet Name", sortable: true },
    {
      key: "isActive",
      label: "Status",
      render: (row: RuleSetData) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: RuleSetData) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            className="border-green-800 text-green-800 hover:bg-green-100"
            size="sm"
            onClick={() => openRuleSetModalForEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-800 text-red-800 hover:bg-red-100"
            onClick={() => handleDeleteRuleSet(row.ruleSetId!)}
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="flex-grow lg:max-w-xs">
                <Select
                  options={patternOptions}
                  placeholder="Select Pattern"
                  value={pattern}
                  onChange={(value) => {
                    setPattern(value);
                    setRuleSet(""); // Reset RuleSet when Pattern changes
                  }}
                  disabled={loading}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openPatternModalForNew}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {pattern && (
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    options={ruleSetOptions}
                    placeholder="Select RuleSet"
                    value={ruleSet}
                    onChange={(value) => setRuleSet(value)}
                    disabled={!pattern || loading}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRuleSetModalForNew}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Pattern Management Modal */}
      <Modal
        isOpen={isPatternModalOpen}
        onClose={() => setIsPatternModalOpen(false)}
        className="max-w-2xl p-6"
      >
        <h2 className="text-xl font-semibold my-4">
          {isEditingPattern ? "Edit Pattern" : "Manage Patterns"}
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
                setPatternDescription(e.target.value);
              }
            }}
            maxLength={200}
          />
        </div>
        <div className="mt-4 flex justify-end items-center gap-3">
          <div className="flex-grow min-h-10">
            {patternModalAlert && (
              <Alert
                variant={patternModalAlert.variant}
                title={patternModalAlert.title}
                message={patternModalAlert.message}
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
              : isEditingPattern
                ? "Update Pattern"
                : "Save Pattern"}
          </Button>
          <Button
            className=" text-red-800 border-red-800 hover:bg-red-100"
            variant="outline"
            onClick={resetPatternForm}
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
          <Button
            variant="outline"
            onClick={() => setIsPatternModalOpen(false)}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* RuleSet Management Modal */}
      <Modal
        isOpen={isRuleSetModalOpen}
        onClose={() => setIsRuleSetModalOpen(false)}
        className="max-w-2xl p-6"
      >
        <h2 className="text-xl font-semibold my-4">
          {isEditingRuleSet ? "Edit RuleSet" : "Manage RuleSets"}
        </h2>

        <div className="space-y-4 border-b pb-4 mb-4">
          <Input
            label="RuleSet Name"
            value={ruleSetName}
            onChange={(e) => {
              if (allowedCharsRegex.test(e.target.value)) {
                setRuleSetName(e.target.value);
              }
            }}
            maxLength={100}
          />
          <Switch
            label="Is Active"
            key={editingRuleSetId || "new"}
            defaultChecked={isRuleSetActive}
            onChange={setIsRuleSetActive}
          />
        </div>

        <div className="mt-4 flex justify-end items-center gap-3">
          <div className="flex-grow min-h-10">
            {ruleSetModalAlert && (
              <Alert
                variant={ruleSetModalAlert.variant}
                title={ruleSetModalAlert.title}
                message={ruleSetModalAlert.message}
              />
            )}
          </div>

          <Button
            className=" text-green-800 border-green-800 hover:bg-green-100"
            variant="outline"
            onClick={handleSaveOrUpdateRuleSet}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditingRuleSet
                ? "Update RuleSet"
                : "Save RuleSet"}
          </Button>

          <Button
            variant="outline"
            className=" text-red-800 border-red-800 hover:bg-red-100"
            onClick={resetRuleSetForm}
          >
            Clear
          </Button>
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Existing RuleSets</h3>
        <div>
          <DataTable
            data={ruleSets}
            columns={ruleSetColumns}
            searchKeys={["name"]}
            filters={filters}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
        <div className="border-t mt-6 pt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setIsRuleSetModalOpen(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
