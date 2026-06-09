import { useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";

interface SelectOption {
  value: string;
  label: string;
}

export default function MarksEntry() {

  // ===== STATE =====
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  // ===== OPTIONS =====
  const CourseOption: SelectOption[] = [ 
  ];

   const Semesteroption: SelectOption[] = [
    { value: "SemesterI", label: "SemesterI" },
    { value: "SemesterII", label: "SemesterII" },
    { value: "SemesterIII", label: "SemesterIII" },
    { value: "SemesterIV", label: "SemesterIV" },
    { value: "SemesterV", label: "SemesterV" },
    { value: "SemesterVI", label: "SemesterVI" },
  ];

  return (
    <ComponentCard title="Marks Entry">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 
        <Select
          options={CourseOption}
          placeholder="Select Course"
          value={selectedCourse}
          onChange={Selectcourse}
        />

        {/* Status Dropdown */}
        <Select
          options={Semesteroption}
          placeholder="Select Semester"
          value={selectedSemester}
          onChange={Selectsemester}
        />

      </div>

    </ComponentCard>
  );
}