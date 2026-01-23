import { useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";

export default function StudentMaster() {
  const [classValue, setClassValue] = useState("");
  const [divisionValue, setDivisionValue] = useState("");

  const classOptions = [
    { value: "1", label: "Mechanical eng" },
    { value: "2", label: "Computer eng" },
    { value: "3", label: "CS" },
  ];

  const divisionOptions = [
    { value: "A", label: "Sem I" },
    { value: "B", label: "Sem II" },
    { value: "C", label: "Sem III" },
  ];

  return (
    <div className="grid-cols-1 gap-4">
      <ComponentCard title="Student Master">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* First DDL */}
          <Select
            options={classOptions}
            placeholder="Select Branch"
            onChange={(value) => setClassValue(value)}
          />

          {/* Second DDL */}
          <Select
            options={divisionOptions}
            placeholder="Select Semister"
            onChange={(value) => setDivisionValue(value)}
          />

        </div>
      </ComponentCard>
    </div>
  );
}
