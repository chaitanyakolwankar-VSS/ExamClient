import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Plus, Pencil, Trash2, ChevronLeft, Save } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import DataTable from "../../../components/ui/table/DataTable";
import Swal from "sweetalert2";
import {
  OrdinanceService,
  PatternData,
  RuleSetData,
  Rule,
  RuleCondition,
  RuleAction,
  GradeMaster,
  GradeThreshold,
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

const allowedCharsRegex = /^[a-zA-Z0-9\-\[\]()+/.,\s]*$/;

const GRADE_PRESETS = [
  { value: "10pt_cbgs", label: "10-Point Scale (CBGS)" },
  { value: "7pt", label: "7-Point Scale" },
  { value: "10pt_revised", label: "10-Point Scale (Revised)" },
];

export default function Ordinance() {
  // Page-level state
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");
  const [ruleSets, setRuleSets] = useState<RuleSetData[]>([]);
  const [ruleSetOptions, setRuleSetOptions] = useState<Option[]>([]);
  const [ruleSet, setRuleSet] = useState("");

  // Grade System State
  const [gradeMasters, setGradeMasters] = useState<GradeMaster[]>([]);
  const [gradeMasterOptions, setGradeMasterOptions] = useState<Option[]>([]);
  const [selectedGradeMaster, setSelectedGradeMaster] = useState<string>("");
  const [isLinkingGrade, setIsLinkingGrade] = useState(false);

  // Grade Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [currentGradeMaster, setCurrentGradeMaster] = useState<GradeMaster>({
    name: "",
    description: "",
    thresholds: [],
  });
  const [isGradeSubmitting, setIsGradeSubmitting] = useState(false);
  const [gradeModalAlert, setGradeModalAlert] = useState<AlertInfo | null>(null);

  // Rule State
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleViewMode, setRuleViewMode] = useState<"list" | "form">("list");
  const [currentRule, setCurrentRule] = useState<Rule>({
    ruleSetId: "",
    name: "",
    priority: 0,
    isEnabled: true,
    stopOnSuccess: false,
    ordinanceSymbol: "",
    conditions: [],
    actions: [],
  });
  const [isRuleSubmitting, setIsRuleSubmitting] = useState(false);

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
    fetchGradeMasters();
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

  // Sync the selected grade master when a ruleset is selected
  useEffect(() => {
    if (ruleSet) {
      const selectedRs = ruleSets.find((rs) => rs.ruleSetId === ruleSet);
      setSelectedGradeMaster(selectedRs?.gradeMasterId || "");
      fetchRules(ruleSet);
    } else {
      setSelectedGradeMaster("");
      setRules([]);
      setRuleViewMode("list");
    }
  }, [ruleSet, ruleSets]);

  // --- Grade Master Functions ---
  const fetchGradeMasters = async () => {
    try {
      const data = await OrdinanceService.getGradeMasters();
      setGradeMasters(data);
      setGradeMasterOptions(
        data.map((g) => ({ value: g.gradeMasterId || "", label: g.name }))
      );
    } catch (error) {
      console.error("Failed to fetch Grade Masters", error);
    }
  };

  const handleLinkGradeMaster = async () => {
    if (!ruleSet) return;
    setIsLinkingGrade(true);
    try {
      const currentRs = ruleSets.find((rs) => rs.ruleSetId === ruleSet);
      if (currentRs) {
        const payload = { ...currentRs, gradeMasterId: selectedGradeMaster };
        const response = await OrdinanceService.updateRuleSet(payload);
        if (response.success) {
          setPageAlert({
            variant: "success",
            title: "Linked!",
            message: "Grading System linked to RuleSet successfully.",
          });
          fetchRuleSets(pattern); // Refresh
        } else {
          setPageAlert({
            variant: "error",
            title: "Error",
            message: response.message || "Failed to link Grading System.",
          });
        }
      }
    } catch (error) {
      setPageAlert({ variant: "error", title: "Error", message: "Unexpected error linking Grade Master." });
    } finally {
      setIsLinkingGrade(false);
    }
  };

  const openGradeModalForNew = () => {
    setCurrentGradeMaster({
      name: "",
      description: "",
      thresholds: [
        { grade: "", gradePoint: 0, minPercentage: 0, maxPercentage: 0, performanceRemark: "" },
      ],
    });
    setGradeModalAlert(null);
    setIsGradeModalOpen(true);
  };

  const handleSaveGradeMaster = async () => {
    if (!currentGradeMaster.name.trim()) {
      setGradeModalAlert({ variant: "warning", title: "Validation Error", message: "System Name is required." });
      return;
    }

    if (currentGradeMaster.thresholds.length === 0) {
      setGradeModalAlert({ variant: "warning", title: "Validation Error", message: "At least one threshold row is required." });
      return;
    }

    // Validate each threshold row
    for (let i = 0; i < currentGradeMaster.thresholds.length; i++) {
      const t = currentGradeMaster.thresholds[i];
      const rowNum = i + 1;

      if (!t.grade.trim()) {
        setGradeModalAlert({ variant: "warning", title: "Row " + rowNum, message: "Grade code is required." });
        return;
      }
      if (t.gradePoint < 0 || t.gradePoint > 10) {
        setGradeModalAlert({ variant: "warning", title: "Row " + rowNum, message: "Grade Point must be between 0 and 10." });
        return;
      }
      if (t.minPercentage < 0 || t.minPercentage > 100 || t.maxPercentage < 0 || t.maxPercentage > 100) {
        setGradeModalAlert({ variant: "warning", title: "Row " + rowNum, message: "Percentages must be between 0 and 100." });
        return;
      }
      if (t.minPercentage > t.maxPercentage) {
        setGradeModalAlert({ variant: "warning", title: "Row " + rowNum, message: "Min % cannot be greater than Max %." });
        return;
      }
      if (!t.performanceRemark.trim()) {
        setGradeModalAlert({ variant: "warning", title: "Row " + rowNum, message: "Performance remark is required." });
        return;
      }
    }

    setIsGradeSubmitting(true);
    try {
      const response = await OrdinanceService.saveGradeMaster(currentGradeMaster);
      if (response.success) {
        setGradeModalAlert({ variant: "success", title: "Success", message: "Grading System created." });
        await fetchGradeMasters();
        setTimeout(() => setIsGradeModalOpen(false), 1000);
      } else {
        setGradeModalAlert({ variant: "error", title: "Error", message: response.message });
      }
    } catch (error) {
      setGradeModalAlert({ variant: "error", title: "Error", message: "Unexpected error occurred." });
    } finally {
      setIsGradeSubmitting(false);
    }
  };

  const addThreshold = () => {
    setCurrentGradeMaster((prev) => ({
      ...prev,
      thresholds: [
        ...prev.thresholds,
        { grade: "", gradePoint: 0, minPercentage: 0, maxPercentage: 0, performanceRemark: "" },
      ],
    }));
  };

  const removeThreshold = (index: number) => {
    setCurrentGradeMaster((prev) => ({
      ...prev,
      thresholds: prev.thresholds.filter((_, i) => i !== index),
    }));
  };

  const updateThreshold = (index: number, field: keyof GradeThreshold, value: string | number) => {
    setCurrentGradeMaster((prev) => {
      const newThresholds = [...prev.thresholds];
      newThresholds[index] = { ...newThresholds[index], [field]: value };
      return { ...prev, thresholds: newThresholds };
    });
  };

  const applyPreset = (presetKey: string) => {
    let thresholds: GradeThreshold[] = [];
    let name = "";

    if (presetKey === "10pt_cbgs") {
      name = "10-Point Scale (CBGS)";
      thresholds = [
        { grade: "O", gradePoint: 10, minPercentage: 80, maxPercentage: 100, performanceRemark: "Outstanding" },
        { grade: "A", gradePoint: 9, minPercentage: 75, maxPercentage: 79.99, performanceRemark: "Excellent" },
        { grade: "B", gradePoint: 8, minPercentage: 70, maxPercentage: 74.99, performanceRemark: "Very Good" },
        { grade: "C", gradePoint: 7, minPercentage: 60, maxPercentage: 69.99, performanceRemark: "Good" },
        { grade: "D", gradePoint: 6, minPercentage: 50, maxPercentage: 59.99, performanceRemark: "Fair" },
        { grade: "E", gradePoint: 5, minPercentage: 45, maxPercentage: 49.99, performanceRemark: "Average" },
        { grade: "P", gradePoint: 4, minPercentage: 40, maxPercentage: 44.99, performanceRemark: "Pass" },
        { grade: "F", gradePoint: 0, minPercentage: 0, maxPercentage: 39.99, performanceRemark: "Fail" },
      ];
    } else if (presetKey === "7pt") {
      name = "7-Point Scale";
      thresholds = [
        { grade: "O", gradePoint: 7, minPercentage: 70, maxPercentage: 100, performanceRemark: "Outstanding" },
        { grade: "A", gradePoint: 6, minPercentage: 60, maxPercentage: 69.99, performanceRemark: "Very Good" },
        { grade: "B", gradePoint: 5, minPercentage: 55, maxPercentage: 59.99, performanceRemark: "Good" },
        { grade: "C", gradePoint: 4, minPercentage: 50, maxPercentage: 54.99, performanceRemark: "Fair" },
        { grade: "D", gradePoint: 3, minPercentage: 45, maxPercentage: 49.99, performanceRemark: "Average" },
        { grade: "E", gradePoint: 2, minPercentage: 40, maxPercentage: 44.99, performanceRemark: "Pass" },
        { grade: "F", gradePoint: 1, minPercentage: 0, maxPercentage: 39.99, performanceRemark: "Fail" },
      ];
    } else if (presetKey === "10pt_revised") {
      name = "10-Point Scale (Revised)";
      thresholds = [
        { grade: "O", gradePoint: 10, minPercentage: 80, maxPercentage: 100, performanceRemark: "Outstanding" },
        { grade: "A+", gradePoint: 9, minPercentage: 70, maxPercentage: 79.99, performanceRemark: "Excellent" },
        { grade: "A", gradePoint: 8, minPercentage: 60, maxPercentage: 69.99, performanceRemark: "Very Good" },
        { grade: "B+", gradePoint: 7, minPercentage: 55, maxPercentage: 59.99, performanceRemark: "Good" },
        { grade: "B", gradePoint: 6, minPercentage: 50, maxPercentage: 54.99, performanceRemark: "Above Average" },
        { grade: "C", gradePoint: 5, minPercentage: 45, maxPercentage: 49.99, performanceRemark: "Average" },
        { grade: "D", gradePoint: 4, minPercentage: 40, maxPercentage: 44.99, performanceRemark: "Pass" },
        { grade: "F", gradePoint: 0, minPercentage: 0, maxPercentage: 39.99, performanceRemark: "Fail" },
      ];
    }

    if (thresholds.length > 0) {
      setCurrentGradeMaster({
        ...currentGradeMaster,
        name: currentGradeMaster.name || name,
        thresholds: thresholds,
      });
    }
  };

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

  // --- Rule Functions ---
  useEffect(() => {
    if (ruleSet) {
      fetchRules(ruleSet);
    } else {
      setRules([]);
      setRuleViewMode("list");
    }
  }, [ruleSet]);

  const fetchRules = async (ruleSetId: string) => {
    try {
      const data = await OrdinanceService.getRules(ruleSetId);
      setRules(data);
    } catch (error) {
      setPageAlert({
        variant: "error",
        title: "Error",
        message: "Failed to fetch Rules.",
      });
    }
  };

  const handleCreateRule = () => {
    setCurrentRule({
      ruleSetId: ruleSet,
      name: "",
      priority: 0,
      isEnabled: true,
      stopOnSuccess: false,
      ordinanceSymbol: "",
      conditions: [{ factName: "", operator: "", value: "" }],
      actions: [
        {
          actionType: "",
          calculationMode: "",
          param1Type: "None",
          param1Value: 0,
          param2Type: "None",
          param2Value: 0,
          maxLimit: 0,
          maxTargetCount: 0,
          target: "TOTAL",
        },
      ],
    });
    setRuleViewMode("form");
  };

  const handleEditRule = (rule: Rule) => {
    // Deep copy to avoid mutating state directly
    setCurrentRule(JSON.parse(JSON.stringify(rule)));
    setRuleViewMode("form");
  };

  const handleSaveRule = async () => {
    if (!currentRule.name.trim()) {
      setPageAlert({
        variant: "warning",
        title: "Validation Error",
        message: "Rule Name is required.",
      });
      return;
    }

    if (!currentRule.ordinanceSymbol) {
      setPageAlert({
        variant: "warning",
        title: "Validation Error",
        message: "Ordinance Symbol is mandatory.",
      });
      return;
    }

    if (currentRule.conditions.length === 0) {
      setPageAlert({
        variant: "warning",
        title: "Validation Error",
        message: "At least one condition (IF) is required.",
      });
      return;
    }

    if (currentRule.actions.length === 0) {
      setPageAlert({
        variant: "warning",
        title: "Validation Error",
        message: "At least one action (THEN) is required.",
      });
      return;
    }

    // Comprehensive Validation
    for (const cond of currentRule.conditions) {
      if (!cond.factName || !cond.operator || !cond.value.trim()) {
        setPageAlert({
          variant: "warning",
          title: "Incomplete Condition",
          message: "All fields in conditions are mandatory.",
        });
        return;
      }
    }

    for (const act of currentRule.actions) {
      if (!act.actionType || !act.calculationMode || !act.target) {
        setPageAlert({
          variant: "warning",
          title: "Incomplete Action",
          message: "Action Type, Mode, and Target are mandatory.",
        });
        return;
      }
    }

    setIsRuleSubmitting(true);
    try {
      const payload = { ...currentRule, ruleSetId: ruleSet };
      const isUpdate = !!currentRule.ruleId;
      const response = isUpdate
        ? await OrdinanceService.updateRule(payload)
        : await OrdinanceService.saveRule(payload);

      if (response.success) {
        Swal.fire({
          title: isUpdate ? "Updated!" : "Saved!",
          text: response.message,
          icon: "success",
          showConfirmButton: false,
          timer: 1500,
        });
        setRuleViewMode("list");
        fetchRules(ruleSet);
      } else {
        setPageAlert({
          variant: "error",
          title: "Error",
          message: response.message || "Operation failed.",
        });
      }
    } catch (error) {
      setPageAlert({
        variant: "error",
        title: "Error",
        message: "An unexpected error occurred while saving the rule.",
      });
    } finally {
      setIsRuleSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    Swal.fire({
      title: "Delete Rule?",
      text: "This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await OrdinanceService.deleteRule(ruleId);
          if (response.success) {
            setPageAlert({
              variant: "success",
              title: "Deleted",
              message: response.message,
            });
            fetchRules(ruleSet);
          } else {
            setPageAlert({
              variant: "error",
              title: "Error",
              message: response.message || "Failed to delete rule.",
            });
          }
        } catch (error) {
          setPageAlert({
            variant: "error",
            title: "Error",
            message: "An unexpected error occurred.",
          });
        }
      }
    });
  };

  // --- Rule Form Helpers (Conditions) ---
  const addCondition = () => {
    setCurrentRule((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { factName: "", operator: "", value: "" },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setCurrentRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (
    index: number,
    field: keyof RuleCondition,
    value: string,
  ) => {
    setCurrentRule((prev) => {
      const newConditions = [...prev.conditions];
      newConditions[index] = { ...newConditions[index], [field]: value };
      return { ...prev, conditions: newConditions };
    });
  };

  // --- Rule Form Helpers (Actions) ---
  const addAction = () => {
    setCurrentRule((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          actionType: "",
          calculationMode: "",
          param1Type: "None",
          param1Value: 0,
          param2Type: "None",
          param2Value: 0,
          maxLimit: 0,
          maxTargetCount: 0,
          target: "Subject", // Default target
        },
      ],
    }));
  };

  const removeAction = (index: number) => {
    setCurrentRule((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (
    index: number,
    field: keyof RuleAction,
    value: string | number,
  ) => {
    setCurrentRule((prev) => {
      const newActions = [...prev.actions];
      newActions[index] = { ...newActions[index], [field]: value };
      return { ...prev, actions: newActions };
    });
  };

  const getRuleSummary = () => {
    if (currentRule.conditions.length === 0 && currentRule.actions.length === 0) {
      return "Start by adding conditions and actions.";
    }

    const condStrings = currentRule.conditions.map((c) => {
      if (!c.factName || !c.operator || !c.value) return "...";
      return `${c.factName} ${c.operator} ${c.value}`;
    });

    const actStrings = currentRule.actions.map((a) => {
      if (!a.actionType || !a.calculationMode) return "...";
      let summary = `${a.actionType} via ${a.calculationMode}`;
      if (a.param1Type !== "None") summary += ` (${a.param1Type}: ${a.param1Value})`;
      summary += ` to ${a.target}`;
      if (a.maxLimit > 0) summary += ` (Max: ${a.maxLimit})`;
      return summary;
    });

    const ifText = condStrings.length > 0 ? `IF (${condStrings.join(" AND ")})` : "IF (No conditions)";
    const thenText = actStrings.length > 0 ? `THEN (${actStrings.join(", ")})` : "THEN (No actions)";

    return `${ifText} → ${thenText}`;
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

  // --- Render Helpers ---
  const renderRulesList = () => {
    const ruleColumns = [
      { key: "priority", label: "Priority", sortable: true },
      { key: "name", label: "Rule Name", sortable: true },
      {
        key: "isEnabled",
        label: "Status",
        render: (r: Rule) => (
          <span
            className={`px-2 py-1 rounded text-xs ${r.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
          >
            {r.isEnabled ? "Enabled" : "Disabled"}
          </span>
        ),
      },
      {
        key: "summary",
        label: "Summary",
        render: (r: Rule) => (
          <span className="text-sm text-gray-500">
            {r.conditions.length} Conds, {r.actions.length} Actions
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (r: Rule) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-800 text-blue-800 hover:bg-blue-100"
              onClick={() => handleEditRule(r)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-800 text-red-800 hover:bg-red-100"
              onClick={() => handleDeleteRule(r.ruleId!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Rules for "{ruleSetOptions.find((o) => o.value === ruleSet)?.label}"
          </h3>
          <Button onClick={handleCreateRule} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add New Rule
          </Button>
        </div>
        <DataTable
          data={rules}
          columns={ruleColumns}
          searchKeys={["name"]}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
    );
  };

  const renderRuleForm = () => {
    return (
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRuleViewMode("list")}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <h3 className="text-lg font-semibold text-gray-800">
              {currentRule.ruleId ? "Edit Rule" : "Create New Rule"}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 flex-grow justify-end">
            {pageAlert && (
              <div className="max-w-2xl flex-grow">
                <Alert
                  variant={pageAlert.variant}
                  title={pageAlert.title}
                  message={pageAlert.message}
                />
              </div>
            )}
            <Button
              onClick={handleSaveRule}
              disabled={isRuleSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
            >
              <Save className="h-4 w-4" />
              {isRuleSubmitting
                ? "Saving..."
                : currentRule.ruleId
                  ? "Update Rule"
                  : "Save Rule"}
            </Button>
          </div>
        </div>

        {/* Rule Summary Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-xs font-bold text-blue-600 uppercase mb-1">Live Rule Summary</h4>
          <p className="text-blue-800 font-medium">{getRuleSummary()}</p>
        </div>

        {/* Rule Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
          <Input
            label="Rule Name"
            value={currentRule.name}
            onChange={(e) => {
              if (allowedCharsRegex.test(e.target.value)) {
                setCurrentRule({ ...currentRule, name: e.target.value });
              }
            }}
            maxLength={100}
            placeholder="e.g., Condonation for 1 Subject"
          />
          <Input
            label="Priority (Order)"
            type="number"
            value={currentRule.priority.toString()}
            onChange={(e) =>
              setCurrentRule({
                ...currentRule,
                priority: parseInt(e.target.value) || 0,
              })
            }
          />
          <div className="flex flex-col gap-4">
            <Select
              label="Ordinance Symbol"
              options={[
                { value: "", label: "None" },
                { value: "*", label: "Condonation (*)" },
                { value: "@", label: "Grace (@)" },
                { value: "#", label: "Quota (#)" },
                { value: "^", label: "^ (Resolution)" },
                { value: "!", label: "! (50% Grace)" },
                { value: "~", label: "Dyslexia (~)" },
              ]}
              value={currentRule.ordinanceSymbol || ""}
              onChange={(val) =>
                setCurrentRule({ ...currentRule, ordinanceSymbol: val })
              }
            />
            <div className="flex gap-4">
              <Switch
                key={`enabled-${currentRule.ruleId || "new"}`}
                label="Enabled"
                defaultChecked={currentRule.isEnabled}
                onChange={(checked) =>
                  setCurrentRule({ ...currentRule, isEnabled: checked })
                }
              />
              <Switch
                key={`stop-${currentRule.ruleId || "new"}`}
                label="Stop on Success"
                defaultChecked={currentRule.stopOnSuccess}
                onChange={(checked) =>
                  setCurrentRule({ ...currentRule, stopOnSuccess: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Conditions Builder */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-700">
              IF (Conditions)
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={addCondition}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Condition
            </Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2">Fact</th>
                  <th className="px-4 py-2">Operator</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentRule.conditions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
                      No conditions added. Rule will always apply?
                    </td>
                  </tr>
                )}
                {currentRule.conditions.map((cond, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-2 py-2">
                      <Select
                        options={[
                          { value: "FailedSubjectCount", label: "Failed Subject Count" },
                          { value: "TotalMarks", label: "Total Marks" },
                          { value: "Percentage", label: "Percentage" },
                          { value: "IsAbsent", label: "Is Absent" },
                        ]}
                        value={cond.factName}
                        onChange={(val) => updateCondition(idx, "factName", val)}
                        placeholder="Select Fact"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        options={[
                          { value: "Equals", label: "Equals (==)" },
                          { value: "NotEquals", label: "Not Equals (!=)" },
                          { value: "GreaterThan", label: "Greater Than (>)" },
                          { value: "LessThan", label: "Less Than (<)" },
                          { value: "GreaterThanOrEqual", label: "Greater/Equal (>=)" },
                          { value: "LessThanOrEqual", label: "Less/Equal (<=)" },
                        ]}
                        value={cond.operator}
                        onChange={(val) => updateCondition(idx, "operator", val)}
                        placeholder="Operator"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={cond.value}
                        onChange={(e) => updateCondition(idx, "value", e.target.value)}
                        placeholder="Value"
                        maxLength={100}
                        className="h-10"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => removeCondition(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions Builder */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-700">
              THEN (Actions)
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={addAction}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Action
            </Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2 min-w-[150px]">Action Type</th>
                  <th className="px-4 py-2 min-w-[150px]">Mode</th>
                  <th className="px-4 py-2 min-w-[200px]">Param 1 (Type/Val)</th>
                  <th className="px-4 py-2 min-w-[200px]">Param 2 (Type/Val)</th>
                  <th className="px-4 py-2 min-w-[100px]">Max Limit</th>
                  <th className="px-4 py-2 min-w-[120px]">Target</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentRule.actions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-gray-400">
                      No actions defined.
                    </td>
                  </tr>
                )}
                {currentRule.actions.map((act, idx) => (
                  <tr key={idx} className="bg-white align-top">
                    <td className="px-2 py-2">
                      <Select
                        options={[
                          { value: "AddGrace", label: "Add Grace Marks" },
                          { value: "SetResult", label: "Set Result Status" },
                          { value: "ApplyLookup", label: "Apply Grace Lookup" },
                          { value: "DowngradeGP", label: "Downgrade GradePoint" },
                        ]}
                        value={act.actionType}
                        onChange={(val) => updateAction(idx, "actionType", val)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        options={[
                          { value: "Fixed", label: "Fixed Value" },
                          { value: "MinOf", label: "Whichever is Less (MinOf)" },
                          { value: "MaxOf", label: "Whichever is More (MaxOf)" },
                          { value: "PercentOfSubject", label: "% of Subject" },
                          { value: "PercentOfAggregate", label: "% of Aggregate" },
                        ]}
                        value={act.calculationMode}
                        onChange={(val) => updateAction(idx, "calculationMode", val)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="space-y-1">
                        <Select
                          options={[
                            { value: "Value", label: "Value" },
                            { value: "PercentOfSubject", label: "% of Subject" },
                            { value: "PercentOfAggregate", label: "% of Aggregate" },
                          ]}
                          value={act.param1Type}
                          onChange={(val) => updateAction(idx, "param1Type", val)}
                        />
                        <Input
                          type="number"
                          value={act.param1Value.toString()}
                          onChange={(e) => updateAction(idx, "param1Value", parseFloat(e.target.value) || 0)}
                          placeholder="Value"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="space-y-1">
                        <Select
                          options={[
                            { value: "None", label: "None" },
                            { value: "Value", label: "Value" },
                            { value: "PercentOfSubject", label: "% of Subject" },
                            { value: "PercentOfAggregate", label: "% of Aggregate" },
                          ]}
                          value={act.param2Type}
                          onChange={(val) => updateAction(idx, "param2Type", val)}
                        />
                        <Input
                          type="number"
                          value={act.param2Value.toString()}
                          onChange={(e) => updateAction(idx, "param2Value", parseFloat(e.target.value) || 0)}
                          placeholder="Value"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        value={act.maxLimit.toString()}
                        onChange={(e) => updateAction(idx, "maxLimit", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        options={[
                          { value: "TOTAL", label: "Head Total" },
                          { value: "ESE", label: "End Sem (ESE)" },
                          { value: "IA", label: "Internal (IA)" },
                          { value: "TW", label: "Term Work (TW)" },
                          { value: "RESULT", label: "Overall Result" },
                        ]}
                        value={act.target}
                        onChange={(val) => updateAction(idx, "target", val)}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => removeAction(idx)}
                        className="text-red-500 hover:text-red-700 p-1 mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-6">
        <ComponentCard title="Ordinance Editor">
          {pageAlert && ruleViewMode === "list" && (
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

          {/* Grade System Linking Section */}
          {ruleSet && (
            <div className="mt-6 border-2 border-brand-200 rounded-lg p-4 bg-brand-50/30">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-brand-800">
                  Grade Point System
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openGradeModalForNew}
                  className="gap-2 text-xs border-brand-300 text-brand-700 hover:bg-brand-100"
                >
                  <Plus className="h-3 w-3" /> Create New Scale
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Select the grading scale (e.g., 10-Point, 7-Point) that applies when this RuleSet is executed.
              </p>
              <div className="flex items-center gap-3 max-w-lg">
                <div className="flex-grow">
                  <Select
                    options={gradeMasterOptions}
                    placeholder="Select Grading System"
                    value={selectedGradeMaster}
                    onChange={setSelectedGradeMaster}
                  />
                </div>
                <Button
                  onClick={handleLinkGradeMaster}
                  disabled={isLinkingGrade || !selectedGradeMaster}
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700 text-white whitespace-nowrap"
                >
                  {isLinkingGrade ? "Linking..." : "Save Link"}
                </Button>
              </div>
            </div>
          )}

          {/* Rules Section - Only visible when a RuleSet is selected */}
          {ruleSet && (
            <div className="mt-4">
              {ruleViewMode === "list" ? renderRulesList() : renderRuleForm()}
            </div>
          )}
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

      {/* Grade Master Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        className="max-w-4xl p-6"
      >
        <h2 className="text-xl font-semibold my-4">Create Grading System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="System Name"
            value={currentGradeMaster.name}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val)) {
                setCurrentGradeMaster({ ...currentGradeMaster, name: val });
              }
            }}
            placeholder="e.g., Mumbai University Scale"
            maxLength={100}
          />
          <Input
            label="Description"
            value={currentGradeMaster.description}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val)) {
                setCurrentGradeMaster({ ...currentGradeMaster, description: val });
              }
            }}
            placeholder="Optional"
            maxLength={200}
          />
          <div className="md:col-span-2">
            <Select
              label="Populate from Preset (Optional)"
              options={[{ value: "", label: "--- Choose a Preset ---" }, ...GRADE_PRESETS]}
              value=""
              onChange={(val) => applyPreset(val)}
              placeholder="Select a standard scale to auto-fill thresholds"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-700">Grade Thresholds</h4>
            <Button size="sm" variant="outline" onClick={addThreshold} className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2 min-w-[80px]">Grade</th>
                  <th className="px-4 py-2 min-w-[80px]">Point</th>
                  <th className="px-4 py-2 min-w-[100px]">Min %</th>
                  <th className="px-4 py-2 min-w-[100px]">Max %</th>
                  <th className="px-4 py-2 min-w-[150px]">Remark</th>
                  <th className="px-4 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentGradeMaster.thresholds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                      No thresholds defined.
                    </td>
                  </tr>
                )}
                {currentGradeMaster.thresholds.map((t, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-2 py-2">
                      <Input
                        value={t.grade}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          // Allow empty (for delete) or exactly one capital letter
                          if (val === "" || /^[A-Z]$/.test(val)) {
                            updateThreshold(idx, "grade", val);
                          }
                        }}
                        placeholder="A"
                        maxLength={1}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        value={t.gradePoint.toString()}
                        onChange={(e) => updateThreshold(idx, "gradePoint", parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step={0.01}
                        value={t.minPercentage.toString()}
                        onChange={(e) => updateThreshold(idx, "minPercentage", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step={0.01}
                        value={t.maxPercentage.toString()}
                        onChange={(e) => updateThreshold(idx, "maxPercentage", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={t.performanceRemark}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            updateThreshold(idx, "performanceRemark", val);
                          }
                        }}
                        placeholder="Outstanding"
                        maxLength={50}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => removeThreshold(idx)} className="text-red-500 hover:text-red-700 p-1 mt-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 border-t pt-4">
          <div className="flex-grow min-h-10">
            {gradeModalAlert && (
              <Alert variant={gradeModalAlert.variant} title={gradeModalAlert.title} message={gradeModalAlert.message} />
            )}
          </div>
          <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveGradeMaster} disabled={isGradeSubmitting} className="bg-brand-600 hover:bg-brand-700 text-white">
            {isGradeSubmitting ? "Saving..." : "Save System"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
