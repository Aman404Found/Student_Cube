/**
 * BrutalBadge — the stamped condition badge (signature element)
 * Spec: design.md §6
 *
 * The ONE loud element per page. Rotated 2–4° off-axis, mono uppercase,
 * rough-edge clip-path to mimic an ink-stamp impression.
 *
 * Color mapping:
 *   "top-viewed"  → ink fill / paper text
 *   "like-new"    → campus-green fill / paper text
 *   "good"        → ledger-blue fill / paper text
 *   "sold"        → stamp-red fill / paper text
 *   "default"     → ink fill / paper text (fallback)
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeCondition =
  | "top-viewed"
  | "like-new"
  | "good"
  | "sold"
  | "default";

interface BrutalBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  condition?: BadgeCondition;
  /** Override the rotation angle in degrees; defaults to a per-condition preset. */
  rotate?: number;
}

const conditionStyles: Record<BadgeCondition, string> = {
  "top-viewed": "bg-ink text-paper",
  "like-new": "bg-campus-green text-paper",
  "good": "bg-ledger-blue text-paper",
  "sold": "bg-stamp-red text-paper",
  "default": "bg-ink text-paper",
};

/** Per-condition default rotation so stamps look hand-placed (design.md §6). */
const conditionRotation: Record<BadgeCondition, number> = {
  "top-viewed": -3,
  "like-new": 2,
  "good": -2,
  "sold": 3,
  "default": -2,
};

/**
 * Rough stamp-edge clip-path (a few extra vertices for an irregular outline).
 * This is intentionally simple — enough to break the perfect rectangle without
 * needing an SVG mask.
 */
const STAMP_CLIP =
  "polygon(2% 4%, 6% 0%, 14% 3%, 22% 0%, 30% 2%, 38% 0%, 46% 3%, 54% 0%, 62% 2%, 70% 0%, 78% 3%, 86% 0%, 94% 2%, 98% 0%, 100% 6%, 98% 14%, 100% 22%, 98% 30%, 100% 38%, 98% 46%, 100% 54%, 98% 62%, 100% 70%, 98% 78%, 100% 86%, 98% 94%, 100% 100%, 94% 98%, 86% 100%, 78% 97%, 70% 100%, 62% 98%, 54% 100%, 46% 97%, 38% 100%, 30% 98%, 22% 100%, 14% 97%, 6% 100%, 0% 98%, 2% 94%, 0% 86%, 2% 78%, 0% 70%, 2% 62%, 0% 54%, 2% 46%, 0% 38%, 2% 30%, 0% 22%, 2% 14%, 0% 6%)";

const BrutalBadge = forwardRef<HTMLSpanElement, BrutalBadgeProps>(
  ({ className, condition = "default", rotate, children, style, ...props }, ref) => {
    const deg = rotate ?? conditionRotation[condition];

    return (
      <span
        ref={ref}
        className={cn(
          // Typography: mono uppercase per design.md §6
          "font-mono font-semibold text-xs uppercase tracking-wide text-nowrap",
          // Layout
          "inline-flex items-center justify-center px-3 py-1",
          // Color per condition
          conditionStyles[condition],
          className,
        )}
        style={{
          transform: `rotate(${deg}deg)`,
          clipPath: STAMP_CLIP,
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  },
);

BrutalBadge.displayName = "BrutalBadge";

export { BrutalBadge };
export type { BrutalBadgeProps, BadgeCondition };
