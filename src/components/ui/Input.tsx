import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-brand-dark">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border border-surface-border bg-white py-2.5 pr-4 text-sm text-brand-dark placeholder:text-gray-400 outline-none transition-all",
              "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
              leftIcon ? "pl-10" : "pl-4",
              error && "border-brand-accent focus:ring-brand-accent/20",
              className
            )}
            {...rest}
          />
        </div>
        {error && <p className="text-xs text-brand-accent">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
