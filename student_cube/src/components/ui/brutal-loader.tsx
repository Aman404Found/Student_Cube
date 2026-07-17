import { cn } from "../../lib/utils";

interface BrutalLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const BrutalLoader = ({ size = "md", className }: BrutalLoaderProps) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-[var(--border-w-sm)]",
    md: "w-8 h-8 border-[var(--border-w)]",
    lg: "w-12 h-12 border-[var(--border-w)]",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className={cn(
          "bg-signal-orange border-ink brutal-loader-spin",
          sizeClasses[size]
        )}
        style={{
          boxShadow: '3px 3px 0 0 var(--color-ink)',
          borderRadius: 'var(--brutal-radius)',
        }}
      />
    </div>
  );
};
