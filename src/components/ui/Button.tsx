import React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm",
  secondary: "bg-brand-secondary text-brand-dark hover:bg-brand-secondary/90 shadow-sm",
  outline:   "border border-surface-border text-brand-dark hover:bg-surface-muted",
  ghost:     "text-brand-primary hover:bg-brand-primary/10",
  danger:    "bg-brand-accent text-white hover:bg-brand-accent/90",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8  px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, leftIcon, rightIcon, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";
