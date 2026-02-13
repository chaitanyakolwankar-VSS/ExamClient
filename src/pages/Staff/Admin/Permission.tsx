import { useState } from "react";
import Select from "../../../components/form/Select";

const Permission = () => {
  const [module, setModule] = useState("");

  const moduleOptions = [
    { value: "frontend", label: "Frontend Module" },
    { value: "backend", label: "Backend Module" },
    { value: "admin", label: "Admin Module" },
  ];

  return (
    <div className="w-60">
      <Select
        options={moduleOptions}
        placeholder="Select Module"
        onChange={(value) => setModule(value)}
        defaultValue=""
      />
    </div>
  );
};

export default Permission;
