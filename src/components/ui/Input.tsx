import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "rounded-none w-full border bg-surface px-4 py-3 font-label text-sm text-foreground placeholder:text-muted transition-colors duration-200 focus:outline-none focus:border-primary focus:ring-0",
            error
              ? "border-accent-coral focus:ring-accent-coral/40"
              : "border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.12)] hover:border-primary/40",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 font-label text-sm text-primary">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
