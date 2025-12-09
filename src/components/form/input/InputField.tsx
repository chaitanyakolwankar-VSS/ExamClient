import type React from "react";
import type { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  label?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  label,
}) => {
  // Base classes
  let inputClasses = `peer w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90`;

  // State colors
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    // Default
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  // Handle Label Logic
  if (label) {
    // 1. We keep the standard height (h-11) so text is centered.
    // 2. We make the placeholder transparent so it doesn't clash with the label when it's inside.
    inputClasses += ` h-11 placeholder:text-transparent`;
  } else {
    inputClasses += ` h-11 placeholder:text-gray-400 dark:placeholder:text-white/30`;
  }

  inputClasses += ` ${className}`;

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        // Placeholder required for :placeholder-shown trick
        placeholder={label ? (placeholder || " ") : placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
      />

      {label && (
        <label
          htmlFor={id}
          className={`
            absolute left-2.5 px-1.5 text-sm text-gray-500 transition-all duration-200 ease-in-out pointer-events-none
            
            /* Default Position (On Border) */
            top-0 -translate-y-1/2 bg-white dark:bg-gray-900 

            /* Inactive State (Inside Input) - Uses peer-placeholder-shown */
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent

            /* Focused State (On Border) */
            peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:text-brand-500 peer-focus:bg-white dark:peer-focus:bg-gray-900

            /* Dark Mode text adjustment */
            dark:text-gray-400
          `}
        >
          {label}
        </label>
      )}

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;