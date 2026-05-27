import { cn } from "@/utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, children, className }: FormFieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-semibold text-ink dark:text-white">{label}</span>
      {children}
      {error ? <span className="block text-xs font-medium text-danger">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-neutral-500 dark:text-neutral-400">{hint}</span> : null}
    </label>
  );
}

