import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldWrapperProps {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputBaseClasses =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldWrapper label={label} error={error} htmlFor={fieldId}>
        <input ref={ref} id={fieldId} className={clsx(inputBaseClasses, className)} {...props} />
      </FieldWrapper>
    );
  }
);
TextField.displayName = "TextField";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldWrapper label={label} error={error} htmlFor={fieldId}>
        <select ref={ref} id={fieldId} className={clsx(inputBaseClasses, className)} {...props}>
          {children}
        </select>
      </FieldWrapper>
    );
  }
);
SelectField.displayName = "SelectField";
