import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  label?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string; 
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  label,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedValue(val);
    onChange(val);
  };

  const hasValue = !!(value !== undefined ? value : selectedValue);
  const isFloating = hasValue || isFocused;

  // Use label if provided, otherwise fallback to placeholder
  const labelText = label || placeholder;

  // Automatically extract/clean label text (e.g., "Select the Branch" -> "Branch")
  const cleanLabel = (text: string) => {
    const cleaned = text
      .replace(/\bselect\s+the\s+/gi, "")
      .replace(/\bselect\s+a\s+/gi, "")
      .replace(/\bselect\s+an\s+/gi, "")
      .replace(/\bselect\s+/gi, "")
      .replace(/\bthe\s+/gi, "")
      .replace(/\bselect\b/gi, "")
      .replace(/\bthe\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || text;
  };

  return (
    <div className="relative w-full h-fit">
      <select
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 text-gray-800 dark:text-white/90 ${className}`}
        value={value !== undefined ? value : selectedValue} 
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
      >
        <option value="" disabled className="text-gray-400 dark:bg-gray-900">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>

      {labelText && (
        <label
          className={`
            absolute left-2.5 px-1.5 transition-all duration-200 ease-in-out pointer-events-none
            top-0 -translate-y-1/2 bg-white dark:bg-gray-900 text-xs text-brand-500 dark:text-gray-400
            ${isFloating ? "opacity-100 scale-100" : "opacity-0 scale-95"}
          `}
        >
          {cleanLabel(labelText)}
        </label>
      )}

      <ChevronDown
        size={22}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      />
    </div>
  );
};

export default Select;
