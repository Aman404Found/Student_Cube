/**
 * BrutalButton — neubrutalist button primitive
 * Spec: design.md §5 (Button rows)
 *
 * Variants:
 *   primary   → signal-orange fill, ink border, ink text
 *   secondary → paper fill, ink border, ink text
 *   destructive → stamp-red fill, paper text — irreversible actions only
 *
 * Renders as <button> by default; pass `asChild` to render as the child element
 * (useful for wrapping <Link> without changing where the link points).
 */

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BrutalButtonVariant = "primary" | "secondary" | "destructive";
type BrutalButtonSize = "default" | "sm" | "lg";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
}

const variantStyles: Record<BrutalButtonVariant, string> = {
  primary:
    "bg-signal-orange text-ink",
  secondary:
    "bg-paper text-ink",
  destructive:
    "bg-stamp-red text-paper",
};

const sizeStyles: Record<BrutalButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm",
  default: "px-6 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // brutal-block interaction pattern (tokens.css)
          "brutal-block brutal-focus",
          // typography: display font, uppercase, bold — per design.md §5
          "font-display font-bold uppercase tracking-tight",
          // layout
          "inline-flex items-center justify-center gap-2",
          // disable browser default
          "cursor-pointer select-none",
          // disabled state
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

BrutalButton.displayName = "BrutalButton";

export { BrutalButton };
export type { BrutalButtonProps, BrutalButtonVariant, BrutalButtonSize };
