/**
 * BrutalCard — neubrutalist card primitive
 * Spec: design.md §5 (Card row)
 *
 * Paper bg, ink border, brutal-block hover lift.
 * An optional `image` slot gets its own inner border so the photo reads as
 * "taped onto a card" rather than bleeding edge-to-edge (design.md §5).
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/* ── Card root ── */
interface BrutalCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Set to true to disable the hover lift (useful inside interactive parents). */
  noHover?: boolean;
}

const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ className, noHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-paper text-ink",
          noHover ? "brutal-block-sm" : "brutal-block",
          "overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
BrutalCard.displayName = "BrutalCard";

/* ── Card image slot — inner bordered photo ── */
const BrutalCardImage = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border-b-[var(--border-w)] border-ink overflow-hidden",
        className,
      )}
      style={{ borderBottomWidth: "var(--border-w)", borderBottomStyle: "solid", borderBottomColor: "var(--color-ink)" }}
      {...props}
    />
  );
});
BrutalCardImage.displayName = "BrutalCardImage";

/* ── Card content area ── */
const BrutalCardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-4", className)}
      {...props}
    />
  );
});
BrutalCardContent.displayName = "BrutalCardContent";

/* ── Card footer ── */
const BrutalCardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 p-4 pt-0",
        className,
      )}
      {...props}
    />
  );
});
BrutalCardFooter.displayName = "BrutalCardFooter";

export { BrutalCard, BrutalCardImage, BrutalCardContent, BrutalCardFooter };
export type { BrutalCardProps };
